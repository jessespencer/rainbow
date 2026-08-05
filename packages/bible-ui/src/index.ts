/**
 * @jessespencer/bible-ui — shared UI components for Bible visualization apps.
 *
 * Provides a consistent header component with title, subtitle,
 * rainbow gradient bar, and a controls slot for app-specific buttons.
 */

export interface AppEntry {
  /** Stable id, matches `HeaderConfig.appId`. */
  id: string;
  label: string;
  tagline: string;
  /** Path the app is served from in production. */
  path: string;
  /** Port the app's dev server is pinned to (see its vite.config.ts). */
  devPort: number;
}

/** Every app in the ecosystem. Add an entry here to add it to the switcher. */
export const APPS: AppEntry[] = [
  {
    id: "rainbow",
    label: "Rainbow Reference",
    tagline: "Cross-reference atlas",
    path: "/rainbow/",
    devPort: 5173,
  },
  {
    id: "chronos",
    label: "Chronos",
    tagline: "Visual history of the Bible",
    path: "/rainbow/timeline/",
    devPort: 5174,
  },
];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

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
}

export interface HeaderHandle {
  /** The root header element (append to your app root). */
  element: HTMLElement;
  /** Container for app-specific controls (zoom buttons, filters, etc.). */
  controls: HTMLElement;
}

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

  const mark = document.createElement("span");
  mark.className = "bui-appswitch__mark";
  trigger.appendChild(mark);

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

    item.append(label, tagline);
    menu.appendChild(item);
  }

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
  header.className = "bui-header";
  if (config.background) {
    header.style.background = config.background;
  }

  const row = document.createElement("div");
  row.className = "bui-header__row";

  if (config.appId) {
    row.appendChild(createAppSwitcher(config.appId));
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
