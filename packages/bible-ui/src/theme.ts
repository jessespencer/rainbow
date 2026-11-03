/**
 * Night and Day. Night (Deep Night) is the default; Day is parchment and ink. The choice is
 * `data-theme="light"` on <html>, saved for every app on this origin. Each app's index.html sets
 * it before first paint (see README), so Day never flashes dark.
 */

import { clearTokens } from "./tokens";

export type Theme = "dark" | "light";

const STORE_KEY = "bui-theme";
const EVENT = "bui-themechange";

// Matches --bg-base in each theme, for the browser's own chrome.
const THEME_COLOR: Record<Theme, string> = { dark: "#020611", light: "#F3EDE0" };

export const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const apply = (theme: Theme) => {
  if (theme === currentTheme()) return;
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  clearTokens();
  document.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: theme }));
};

export const setTheme = (theme: Theme): void => {
  apply(theme);
  try {
    localStorage.setItem(STORE_KEY, theme);
  } catch {
    // Private windows can refuse storage; the theme then lasts for this visit only.
  }
};

/** Runs after the theme changes, here or in another tab. Canvas and WebGL code redraws here. */
export const onThemeChange = (callback: (theme: Theme) => void): void => {
  document.addEventListener(EVENT, (event) => callback((event as CustomEvent<Theme>).detail));
};

// Another tab of any app switched: follow it.
addEventListener("storage", (event) => {
  if (event.key === STORE_KEY) apply(event.newValue === "light" ? "light" : "dark");
});
