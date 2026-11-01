/**
 * The King and Priest toggle for the Lineage view, with a short scripture card
 * for each story. Its state lives in the URL as `?line=`.
 */

import { APPS, appHref } from "@jessespencer/bible-ui";
import { el } from "./dom.ts";

export type LineMode = "all" | "royal" | "priestly" | "both";

interface Reference {
  label: string;
  param: string;
}

interface Story {
  title: string;
  text: string;
  refs: Reference[];
}

const MODES: { mode: LineMode; label: string }[] = [
  { mode: "all", label: "All lines" },
  { mode: "royal", label: "Royal" },
  { mode: "priestly", label: "Priestly" },
  { mode: "both", label: "Both" },
];

const STORIES: Partial<Record<LineMode, Story>> = {
  royal: {
    title: "The royal line",
    text: "The scepter was promised to Judah and the throne to David's house. Matthew traces that line, king by king, to Jesus.",
    refs: [
      { label: "Gen 49:10", param: "Gen.49.10" },
      { label: "2 Sam 7:16", param: "2Sam.7.16" },
      { label: "Matt 1:1", param: "Matt.1.1" },
      { label: "Rev 19:16", param: "Rev.19.16" },
    ],
  },
  priestly: {
    title: "The priestly line",
    text: "Levi's sons served from Aaron on. But Jesus came from Judah, not Levi, so his priesthood isn't inherited. It comes by God's oath, in the order of Melchizedek.",
    refs: [
      { label: "Exod 28:1", param: "Exod.28.1" },
      { label: "Ps 110:4", param: "Ps.110.4" },
      { label: "Heb 7:14–17", param: "Heb.7.14-17" },
    ],
  },
  both: {
    title: "A priest on His throne",
    text: "Two brothers, two offices, and lines kept apart for centuries. Zechariah saw them meet in one person: “He will be a priest on His throne.”",
    refs: [
      { label: "Zech 6:13", param: "Zech.6.13" },
      { label: "Ps 110:1–4", param: "Ps.110.1-4" },
      { label: "Heb 4:14", param: "Heb.4.14" },
    ],
  },
};

export const parseLineMode = (value: string | null): LineMode =>
  MODES.find(({ mode }) => mode === value)?.mode ?? "all";

export interface LineToggleHandle {
  setMode: (mode: LineMode) => void;
  setVisible: (visible: boolean) => void;
}

export const initLineToggle = (
  toggleParent: HTMLElement,
  cardParent: HTMLElement,
  onChange: (mode: LineMode) => void,
): LineToggleHandle => {
  const toggle = el("div", "line-toggle", toggleParent);
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Choose a line to follow");

  const card = el("aside", "line-card", cardParent);
  card.hidden = true;
  const title = el("h3", "line-card__title", card);
  const text = el("p", "line-card__text", card);
  const refs = el("div", "line-card__refs", card);

  let current: LineMode = "all";
  let visible = false;

  const renderCard = () => {
    const story = STORIES[current];
    card.hidden = !visible || !story;
    if (!story) return;
    title.textContent = story.title;
    text.textContent = story.text;
    refs.replaceChildren();
    for (const { label, param } of story.refs) {
      const link = el("a", undefined, refs);
      link.href = `${appHref(APPS[0]!)}?ref=${param}`;
      link.textContent = label;
    }
  };

  const buttons = MODES.map(({ mode, label }) => {
    const button = el("button", "line-toggle__btn", toggle);
    button.textContent = label;
    button.addEventListener("click", () => {
      setMode(mode);
      onChange(mode);
    });
    return { mode, button };
  });

  const setMode = (mode: LineMode) => {
    current = mode;
    for (const { mode: own, button } of buttons) {
      button.classList.toggle("line-toggle__btn--active", own === mode);
      button.setAttribute("aria-pressed", String(own === mode));
    }
    renderCard();
  };

  setMode("all");

  return {
    setMode,
    setVisible: (next) => {
      visible = next;
      toggle.hidden = !next;
      renderCard();
    },
  };
};
