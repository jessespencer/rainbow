/**
 * Translation picker — a small chip in the reading panel's header that opens the
 * Bibles on offer, grouped by language, with the chosen one's licence underneath.
 */

import { swallowPress } from "./guide";
import { TRANSLATIONS, type Translation } from "./translations";

export interface TranslationPickerConfig {
  parent: HTMLElement;
  current: Translation;
  onChange: (translation: Translation) => void;
}

export interface TranslationPickerHandle {
  set: (translation: Translation) => void;
}

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent?: HTMLElement) => {
  const el = document.createElement(tag);
  el.className = className;
  parent?.append(el);
  return el;
};

const CHEVRON =
  '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg>';

export const createTranslationPicker = ({ parent, current, onChange }: TranslationPickerConfig): TranslationPickerHandle => {
  let chosen = current;

  const root = node("div", "bui-version", parent);
  const button = node("button", "bui-version__button", root);
  button.type = "button";
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");
  const panel = node("div", "bui-version__panel", root);
  panel.hidden = true;

  const options = new Map<string, HTMLButtonElement>();
  const languages = [...new Set(TRANSLATIONS.map((t) => t.languageName))];
  for (const language of languages) {
    node("p", "bui-version__language", panel).textContent = language;
    for (const translation of TRANSLATIONS.filter((t) => t.languageName === language)) {
      const option = node("button", "bui-version__option", panel);
      option.type = "button";
      option.lang = translation.language;
      node("span", "bui-version__name", option).textContent = translation.name;
      node("span", "bui-version__abbr", option).textContent = translation.abbr;
      option.addEventListener("click", () => {
        setOpen(false);
        if (translation.id === chosen.id) return;
        set(translation);
        onChange(translation);
      });
      options.set(translation.id, option);
    }
  }
  const license = node("p", "bui-version__license", panel);

  const set = (translation: Translation) => {
    chosen = translation;
    button.innerHTML = `<span>${translation.abbr}</span>${CHEVRON}`;
    button.setAttribute("aria-label", `Translation: ${translation.name}`);
    button.title = translation.name;
    for (const [id, option] of options) option.setAttribute("aria-pressed", String(id === translation.id));
    license.innerHTML = "";
    license.append(`${translation.name}: `);
    const link = node("a", "", license);
    link.href = translation.licenseUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = translation.license;
  };

  const setOpen = (open: boolean) => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    root.classList.toggle("bui-version--open", open);
    if (open) options.get(chosen.id)?.focus();
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(panel.hidden);
  });
  document.addEventListener("pointerdown", (event) => {
    if (panel.hidden || root.contains(event.target as Node)) return;
    setOpen(false);
    swallowPress(event);
  }, true);
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.stopPropagation();
      setOpen(false);
      button.focus();
    }
    // Up and down move through the translations while the panel is open.
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !panel.hidden) {
      event.preventDefault();
      const list = [...options.values()];
      const at = list.indexOf(document.activeElement as HTMLButtonElement);
      const next = list[(at + (event.key === "ArrowDown" ? 1 : list.length - 1)) % list.length];
      next?.focus();
    }
  });

  set(current);
  return { set };
};
