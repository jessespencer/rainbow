/**
 * @jessespencer/bible-ui — shared UI components for Bible visualization apps.
 *
 * Provides a consistent header component with title, subtitle,
 * rainbow gradient bar, and a controls slot for app-specific buttons.
 */

import { currentTheme, onThemeChange, setTheme, type Theme } from "./theme";

export interface AppEntry {
  /** Stable id, matches `HeaderConfig.appId`. */
  id: string;
  label: string;
  tagline: string;
  /** Path the app is served from in production. */
  path: string;
  /** Port the app's dev server is pinned to (see its vite.config.ts). */
  devPort: number;
  /** The inside of a 24×24 Lucide icon, so this package needs no icon dependency. */
  icon: string;
  /** The app's accent as an `r, g, b` triple; its stylesheet sets the same value as `--accent-rgb`. */
  accent: string;
  /** The same accent deepened for Day's paper. */
  accentLight: string;
}

/** Every app in the ecosystem. Add an entry here to add it to the switcher. */
export const APPS: AppEntry[] = [
  {
    id: "atlas",
    label: "Atlas",
    tagline: "Every cross-reference in the Bible",
    path: "/bible/atlas/",
    devPort: 5173,
    // Lucide "rainbow": three arches, like the arc diagram
    icon: '<path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/>',
    // Starlight, and by day a blue-black ink
    accent: "142, 197, 255",
    accentLight: "36, 82, 150",
  },
  {
    id: "lineage",
    label: "Lineage",
    tagline: "Visual history of the Bible",
    path: "/bible/lineage/",
    devPort: 5174,
    // Lucide "git-branch": a family line branching off the main one
    icon: '<path d="M15 6a9 9 0 0 0-9 9V3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>',
    // Candlelight, and by day an iron-gall amber
    accent: "242, 196, 107",
    accentLight: "146, 94, 18",
  },
];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

// Each app's icon glows in its own accent, here and in the menu.
const appIcon = (app: AppEntry | undefined, className: string): SVGElement => {
  const holder = document.createElement("span");
  holder.innerHTML =
    `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${app?.icon ?? ""}</svg>`;
  const svg = holder.firstElementChild as SVGElement;
  if (app) {
    svg.style.setProperty("--app-accent-dark", app.accent);
    svg.style.setProperty("--app-accent-light", app.accentLight);
  }
  return svg;
};

/**
 * Resolves the URL for an app. In production every app lives on one origin,
 * so the plain path works. In dev each app has its own Vite server, so we
 * cross the port boundary explicitly.
 */
export const appHref = (app: AppEntry): string =>
  LOCAL_HOSTS.has(location.hostname)
    ? `${location.protocol}//${location.hostname}:${app.devPort}${app.path}`
    : app.path;

export interface HeaderConfig {
  title: string;
  subtitle: string;
  /** Background color for the header. Defaults to transparent. */
  background?: string;
  /** Id of the current app — renders the app switcher when provided. */
  appId?: string;
  /** One-bar layout: brand, centered slot, actions, with the gradient along the top edge. */
  compact?: boolean;
}

export interface HeaderHandle {
  /** The root header element (append to your app root). */
  element: HTMLElement;
  /** Container for app-specific controls (zoom buttons, filters, etc.). */
  controls: HTMLElement;
  /** Centered slot between the title and the controls. Only in compact headers. */
  center: HTMLElement | null;
}

const THEME_ICONS: Record<Theme, string> = {
  // Lucide "moon" and "sun"
  dark: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  light:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/>' +
    '<path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/>' +
    '<path d="m19.07 4.93-1.41 1.41"/>',
};

/** Night and Day, at the foot of the switcher menu, so it follows the reader to every app. */
const createThemeSwitch = (): HTMLElement => {
  const group = document.createElement("div");
  group.className = "bui-theme segmented";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Appearance");
  const buttons = (["dark", "light"] as const).map((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ` +
      `stroke-linejoin="round" aria-hidden="true">${THEME_ICONS[theme]}</svg>${theme === "dark" ? "Night" : "Day"}`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setTheme(theme);
    });
    group.append(button);
    return { theme, button };
  });
  const sync = () => {
    for (const { theme, button } of buttons) {
      const on = theme === currentTheme();
      button.classList.toggle("active", on);
      button.setAttribute("aria-pressed", String(on));
    }
  };
  sync();
  onThemeChange(sync);
  return group;
};

/**
 * Dropdown for moving between apps. Renders left of the title group;
 * the trigger shows the current app, the menu links to the others.
 */
const createAppSwitcher = (currentId: string): HTMLElement => {
  const current = APPS.find((app) => app.id === currentId);

  const root = document.createElement("div");
  root.className = "bui-appswitch";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "bui-appswitch__trigger";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "Switch app");

  trigger.appendChild(appIcon(current, "bui-appswitch__mark"));

  const chevron = document.createElement("span");
  chevron.className = "bui-appswitch__chevron";
  chevron.textContent = "▾";
  trigger.appendChild(chevron);

  const menu = document.createElement("div");
  menu.className = "bui-appswitch__menu";
  menu.hidden = true;

  for (const app of APPS) {
    const item = document.createElement("a");
    item.className = "bui-appswitch__item";
    item.href = appHref(app);

    if (app.id === current?.id) {
      item.classList.add("bui-appswitch__item--current");
      item.setAttribute("aria-current", "page");
    }

    const label = document.createElement("span");
    label.className = "bui-appswitch__item-label";
    label.textContent = app.label;

    const tagline = document.createElement("span");
    tagline.className = "bui-appswitch__item-tagline";
    tagline.textContent = app.tagline;

    const text = document.createElement("span");
    text.className = "bui-appswitch__item-text";
    text.append(label, tagline);

    item.append(appIcon(app, "bui-appswitch__item-icon"), text);
    menu.appendChild(item);
  }

  menu.appendChild(createThemeSwitch());

  const setOpen = (open: boolean): void => {
    menu.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    root.classList.toggle("bui-appswitch--open", open);
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(menu.hidden);
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target as Node)) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  root.append(trigger, menu);
  return root;
};

/**
 * Creates the shared site header with title, subtitle, gradient bar,
 * and a controls slot. Caller appends their own buttons into `controls`.
 */
export const createHeader = (config: HeaderConfig): HeaderHandle => {
  const header = document.createElement("header");
  header.className = config.compact ? "bui-header bui-header--compact" : "bui-header";
  if (config.background) {
    header.style.background = config.background;
  }

  const row = document.createElement("div");
  row.className = "bui-header__row";

  const brand = document.createElement("div");
  brand.className = "bui-header__brand";

  if (config.appId) {
    brand.appendChild(createAppSwitcher(config.appId));
  }

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
  brand.appendChild(titleGroup);
  row.appendChild(brand);

  const center = config.compact ? document.createElement("div") : null;
  if (center) {
    center.className = "bui-header__center";
    row.appendChild(center);
  }

  const controls = document.createElement("div");
  controls.className = "bui-header__controls";
  row.appendChild(controls);

  header.appendChild(row);

  const gradient = document.createElement("div");
  gradient.className = "bui-header__gradient";
  header.appendChild(gradient);

  return { element: header, controls, center };
};

/** Google Fonts URL for EB Garamond, IM Fell Great Primer and DM Mono. */
export const FONT_URL =
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=IM+Fell+Great+Primer:ital@0;1&display=block";

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
