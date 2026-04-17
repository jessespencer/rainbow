/**
 * @jessespencer/bible-ui — shared UI components for Bible visualization apps.
 *
 * Provides a consistent header component with title, subtitle,
 * rainbow gradient bar, and a controls slot for app-specific buttons.
 */

export interface HeaderConfig {
  title: string;
  subtitle: string;
}

export interface HeaderHandle {
  /** The root header element (append to your app root). */
  element: HTMLElement;
  /** Container for app-specific controls (zoom buttons, filters, etc.). */
  controls: HTMLElement;
}

/**
 * Creates the shared site header with title, subtitle, gradient bar,
 * and a controls slot. Caller appends their own buttons into `controls`.
 */
export const createHeader = (config: HeaderConfig): HeaderHandle => {
  const header = document.createElement("header");
  header.className = "bui-header";

  const row = document.createElement("div");
  row.className = "bui-header__row";

  const titleGroup = document.createElement("div");
  titleGroup.className = "bui-header__title-group";

  const h1 = document.createElement("h1");
  h1.className = "bui-header__title";
  h1.textContent = config.title;

  const subtitle = document.createElement("p");
  subtitle.className = "bui-header__subtitle";
  subtitle.textContent = config.subtitle;

  titleGroup.appendChild(h1);
  titleGroup.appendChild(subtitle);
  row.appendChild(titleGroup);

  const controls = document.createElement("div");
  controls.className = "bui-header__controls";
  row.appendChild(controls);

  header.appendChild(row);

  const gradient = document.createElement("div");
  gradient.className = "bui-header__gradient";
  header.appendChild(gradient);

  return { element: header, controls };
};

/** Google Fonts URL for Fraunces + DM Mono. */
export const FONT_URL =
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1&display=swap";

/**
 * Injects the Google Fonts stylesheet link if not already present.
 * Call once at app startup.
 */
export const loadFonts = (): void => {
  if (document.querySelector(`link[href="${FONT_URL}"]`)) return;

  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "";
  document.head.appendChild(preconnect2);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_URL;
  document.head.appendChild(link);
};
