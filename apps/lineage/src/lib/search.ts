/**
 * Search — people, eras and years from one box in the header. ⌘K or Ctrl K
 * focuses it from anywhere.
 */

import { formatYear, MAX_YEAR, MIN_YEAR } from "./scale.ts";
import { el } from "./dom.ts";
import { formatDates } from "./tooltip.ts";
import { ERA_BANDS } from "./eras.ts";
import type { EraBand } from "./eras.ts";
import { allFigures } from "./renderLineage.ts";
import type { TimelineFigure } from "../data/timeline.ts";

const MAX_RESULTS = 8;

export type SearchResult =
  | { kind: "figure"; figure: TimelineFigure }
  | { kind: "era"; era: EraBand }
  | { kind: "year"; year: number };

// "586 BC", "AD 33", "33 ad". A bare number means BC, since nearly all of the timeline is.
const parseYear = (text: string): number | null => {
  const match = /^(ad|ce)?\s*(\d{1,4})\s*(bc|bce|ad|ce)?$/i.exec(text);
  if (!match) return null;
  const isAd = Boolean(match[1]) || /^(ad|ce)$/i.test(match[3] ?? "");
  const year = isAd ? Number(match[2]) : -Number(match[2]);
  return year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
};

const findResults = (text: string): SearchResult[] => {
  const query = text.trim().toLowerCase();
  if (!query) return [];

  const year = parseYear(query);
  const people = allFigures
    .filter((f) => f.name.toLowerCase().includes(query))
    .sort(
      (a, b) =>
        Number(b.name.toLowerCase().startsWith(query)) -
        Number(a.name.toLowerCase().startsWith(query)),
    )
    .map((figure): SearchResult => ({ kind: "figure", figure }));
  const eras = ERA_BANDS
    .filter((era) => era.name.toLowerCase().includes(query))
    .map((era): SearchResult => ({ kind: "era", era }));

  return [
    ...(year === null ? [] : [{ kind: "year", year } as SearchResult]),
    ...people,
    ...eras,
  ].slice(0, MAX_RESULTS);
};

const resultLabel = (result: SearchResult): [string, string] => {
  if (result.kind === "year") return [formatYear(result.year), "Who was alive"];
  if (result.kind === "era") {
    const { name, startYear, endYear } = result.era;
    return [name, `${formatYear(startYear)} – ${formatYear(endYear)}`];
  }
  return [result.figure.name, formatDates(result.figure)];
};

export const initSearch = (parent: HTMLElement, onPick: (result: SearchResult) => void) => {
  const box = el("div", "search", parent);

  const input = el("input", "search__input", box);
  input.type = "search";
  input.placeholder = "Find David, 586 BC, the Exile...";
  input.setAttribute("aria-label", "Find a person, year or era");
  input.setAttribute("aria-keyshortcuts", "Meta+K Control+K");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", "search-results");
  input.enterKeyHint = "go";

  const hint = el("kbd", "search__hint", box);
  hint.setAttribute("aria-hidden", "true");
  hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

  const list = el("div", "search__results", box);
  list.id = "search-results";
  list.setAttribute("role", "listbox");
  list.hidden = true;

  let results: SearchResult[] = [];
  let active = 0;

  const close = () => {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
  };

  const pick = (result: SearchResult) => {
    input.value = "";
    close();
    input.blur();
    onPick(result);
  };

  const render = () => {
    list.replaceChildren();
    results.forEach((result, i) => {
      const [name, note] = resultLabel(result);
      const option = el("button", "search__result", list);
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(i === active));
      el("span", undefined, option).textContent = name;
      el("span", "search__note", option).textContent = note;
      // Fires before the input's blur closes the list.
      option.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pick(result);
      });
    });
    if (results.length === 0) {
      el("p", "search__empty", list).textContent = "No person, year or era matches.";
    }
    list.hidden = !input.value.trim();
    input.setAttribute("aria-expanded", String(!list.hidden));
  };

  input.addEventListener("input", () => {
    results = findResults(input.value);
    active = 0;
    render();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (results.length === 0) return;
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      active = (active + step + results.length) % results.length;
      render();
    } else if (e.key === "Enter") {
      const result = results[active];
      if (result) pick(result);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      input.value = "";
      close();
      input.blur();
    }
  });

  input.addEventListener("blur", close);

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
};
