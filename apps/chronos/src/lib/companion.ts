/**
 * Companion — the docked panel (a bottom sheet on phones) for whatever is
 * selected: one person with their scripture, or everyone alive in a year.
 */

import { APPS, appHref } from "@jessespencer/bible-ui";
import { setupSheet } from "@jessespencer/bible-ui/sheet";
import { shareView } from "@jessespencer/bible-ui/share";
import { createTranslationPicker } from "@jessespencer/bible-ui/translation-picker";
import { Check, createElement, Share2 } from "lucide";
import {
  DEFAULT_TRANSLATION, LINKED_TRANSLATIONS, readElsewhereHref, saveTranslation, savedTranslation, translationById,
  type Translation,
} from "@jessespencer/bible-ui/translations";
import { formatYear } from "./scale.ts";
import { describeLife, formatDates, formatReign } from "./tooltip.ts";
import { el } from "./dom.ts";
import { CATEGORY_NAMES, CATEGORY_ORDER } from "./categories.ts";
import { loadBible, locate, parseScripture } from "./scripture.ts";
import type { Passage } from "./scripture.ts";
import { ERA_BANDS } from "./eras.ts";
import { allFigures, childrenOf } from "./renderLineage.ts";
import type { Category, TimelineFigure } from "../data/timeline.ts";

const PREVIEW_VERSES = 6;
const COPIED_MS = 1600;

export interface CompanionHandle {
  showFigure: (figure: TimelineFigure, alongside: TimelineFigure[]) => void;
  showYear: (year: number, alive: TimelineFigure[]) => void;
  hide: () => void;
}

interface CompanionEvents {
  onFigure: (id: string) => void;
  onStep: (step: -1 | 1) => void;
  onClose: () => void;
  /** The reader picked another translation. */
  onTranslation: () => void;
}

const eraAt = (year: number): string =>
  ERA_BANDS.find((era) => year >= era.startYear && year < era.endYear)?.name ?? "";

// The translation being read: a ?tr= link wins, then the reader's last pick, shared with Atlas.
let translation: Translation =
  translationById(new URLSearchParams(location.search).get("tr")) ?? savedTranslation();

export const readingTranslation = (): Translation => translation;

const rainbowHref = (passage: Passage): string =>
  `${appHref(APPS[0]!)}?ref=${passage.param}${translation.id === DEFAULT_TRANSLATION.id ? "" : `&tr=${translation.id}`}`;

const heading = (parent: HTMLElement, eyebrow: string, title: string, note: string, color?: string) => {
  parent.replaceChildren();
  const top = el("div", "cp-eyebrow", parent);
  if (color) el("span", undefined, top).style.background = color;
  top.append(eyebrow);
  el("h2", "cp-title", parent).textContent = title;
  el("p", "cp-note", parent).textContent = note;
};

const section = (body: HTMLElement, title: string, count?: number): HTMLElement => {
  const root = el("section", "cp-section", body);
  const head = el("h3", "cp-section-title", root);
  head.textContent = title;
  if (count !== undefined) el("span", undefined, head).textContent = String(count);
  return root;
};

const figureRow = (parent: HTMLElement, figure: TimelineFigure, onFigure: (id: string) => void) => {
  const row = el("button", "cp-row", parent);
  row.style.setProperty("--dot-color", `var(--cat-${figure.category})`);
  el("span", "cp-row__name", row).textContent = figure.name;
  el("span", "cp-row__dates", row).textContent = formatDates(figure);
  el("span", "cp-row__blurb", row).textContent = figure.blurb;
  row.addEventListener("click", () => onFigure(figure.id));
};

export const initCompanion = (
  stage: HTMLElement,
  { onFigure, onStep, onClose, onTranslation }: CompanionEvents,
): CompanionHandle => {
  const panel = el("aside", "bui-sheet companion hidden", stage);
  panel.setAttribute("aria-label", "Details");
  panel.dataset.sheet = "peek";

  const handle = el("div", "bui-sheet__handle", panel);
  el("span", undefined, handle);

  const head = el("header", "companion__head", panel);
  const headingEl = el("div", "companion__heading", head);
  const version = el("div", "companion__version", head);
  const nav = el("nav", "companion__nav", head);
  const button = (label: string, text: string, onClick: () => void) => {
    const btn = el("button", undefined, nav);
    btn.setAttribute("aria-label", label);
    btn.textContent = text;
    btn.addEventListener("click", onClick);
  };
  const share = el("button", "companion__share", nav);
  share.setAttribute("aria-label", "Share");
  share.title = "Share";
  share.append(createElement(Share2));
  share.addEventListener("click", async () => {
    const title = headingEl.querySelector(".cp-title")?.textContent ?? "Lineage";
    if ((await shareView(`${title} · Lineage`)) !== "copied") return;
    share.replaceChildren(createElement(Check));
    share.title = "Link copied";
    setTimeout(() => {
      share.replaceChildren(createElement(Share2));
      share.title = "Share";
    }, COPIED_MS);
  });
  button("Previous", "‹", () => onStep(-1));
  button("Next", "›", () => onStep(1));
  button("Close", "×", onClose);

  const body = el("div", "companion__body", panel);
  // Names the text and its licence; the openly licensed translations ask for it wherever they're shown.
  const source = el("p", "companion__source", panel);
  const sheet = setupSheet(panel, handle, onClose);

  let shown: { figure: TimelineFigure; alongside: TimelineFigure[] } | null = null;
  const showSource = () => { source.textContent = `${translation.name} · ${translation.license}`; };
  showSource();
  createTranslationPicker({
    parent: version,
    current: translation,
    onChange: (next) => {
      translation = next;
      saveTranslation(next);
      showSource();
      if (shown) handle_.showFigure(shown.figure, shown.alongside);
      onTranslation();
    },
  });

  const open = () => {
    if (panel.classList.contains("hidden")) sheet.reset();
    panel.classList.remove("hidden");
    body.scrollTop = 0;
  };

  // Verse text loads after the panel, so a newer selection must win the race.
  let renderId = 0;

  const renderScripture = (figure: TimelineFigure) => {
    const passages = parseScripture(figure.scriptureRef);
    const first = passages[0];
    if (!first) return;

    const id = ++renderId;
    const root = section(body, "Scripture");
    const text = el("p", "cp-text cp-loading", root);
    text.textContent = "Loading…";

    text.lang = translation.language;
    loadBible(translation.file).then(
      (verses) => {
        if (id !== renderId) return;
        text.classList.remove("cp-loading");
        text.replaceChildren();
        const last = Math.min(first.end, first.start + PREVIEW_VERSES - 1);
        for (let i = first.start; i <= last; i++) {
          if (!verses[i]) continue;
          el("sup", undefined, text as HTMLElement).textContent = String(locate(i).verse);
          text.append(`${verses[i]} `);
        }
      },
      () => {
        if (id === renderId) text.textContent = "Scripture text couldn't load.";
      },
    );

    const links = el("div", "cp-links", root);
    for (const passage of passages) {
      const link = el("a", "cp-context", links);
      link.href = rainbowHref(passage);
      link.textContent = `${passage.label} in Atlas ›`;
    }
    // Copyrighted translations can't be bundled, so the passage links out to them instead.
    const elsewhere = el("p", "cp-elsewhere", root);
    elsewhere.append("Also in ");
    LINKED_TRANSLATIONS.forEach((version, i) => {
      if (i > 0) elsewhere.append(" · ");
      const link = el("a", undefined, elsewhere);
      // The chapter Atlas opens, like "1Sam 16"; a label such as "1 Samuel – 1 Kings" is no search.
      link.href = readElsewhereHref(first.param.replace(".", " "), version);
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = version;
    });
  };

  const handle_: CompanionHandle = {
    showFigure: (figure, alongside) => {
      shown = { figure, alongside };
      open();
      const reign =
        figure.reignStart != null && figure.reignEnd != null
          ? ` · ${formatReign(figure.reignStart, figure.reignEnd)}`
          : "";
      heading(
        headingEl,
        CATEGORY_NAMES[figure.category],
        figure.name,
        `${describeLife(figure)}${reign}`,
        `var(--cat-${figure.category})`,
      );
      body.replaceChildren();
      el("p", "cp-text cp-lead", el("div", "cp-quote", body)).textContent = figure.blurb;
      renderScripture(figure);
      const parent = allFigures.find((f) => f.id === figure.parent);
      const family = [...(parent ? [parent] : []), ...childrenOf(figure)];
      if (family.length > 0) {
        const root = section(body, "Family line", family.length);
        for (const relative of family) figureRow(root, relative, onFigure);
      }
      if (alongside.length > 0) {
        const root = section(body, "Alive alongside", alongside.length);
        for (const other of alongside) figureRow(root, other, onFigure);
      }
    },

    showYear: (year, alive) => {
      shown = null;
      open();
      renderId++;
      const count = alive.length === 1 ? "1 person" : `${alive.length} people`;
      heading(headingEl, eraAt(year), `Alive in ${formatYear(year)}`, count);
      body.replaceChildren();

      if (alive.length === 0) {
        el("p", "cp-empty", body).textContent = "No one on the timeline at this date.";
        return;
      }
      const grouped = new Map<Category, TimelineFigure[]>();
      for (const figure of alive) {
        const group = grouped.get(figure.category);
        if (group) group.push(figure);
        else grouped.set(figure.category, [figure]);
      }
      for (const category of CATEGORY_ORDER) {
        const group = grouped.get(category);
        if (!group) continue;
        const root = section(body, CATEGORY_NAMES[category], group.length);
        for (const figure of group.sort((a, b) => a.birth - b.birth)) {
          figureRow(root, figure, onFigure);
        }
      }
    },

    hide: () => {
      renderId++;
      shown = null;
      panel.classList.add("hidden");
    },
  };
  return handle_;
};
