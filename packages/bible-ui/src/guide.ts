/**
 * Controls guide — a button that opens how to explore the current view, and a
 * one-time tip the first time a reader opens each view. Apps pass their own
 * icons, so this package doesn't depend on an icon set.
 */

export interface GuideStep {
  icon: () => SVGElement;
  text: string;
  /** A few words for the first-visit tip; the guide shows `text`. */
  tip?: string;
}

export interface GuideKey {
  keys: string[];
  text: string;
}

export interface GuideContent {
  /** Names the view, as in "Exploring the arcs". */
  title: string;
  pointer: GuideStep[];
  touch: GuideStep[];
  keys: GuideKey[];
}

export interface GuideConfig {
  /** Where the Controls button goes. */
  parent: HTMLElement;
  /** The area the tip floats over and listens to for the first interaction. */
  stage: HTMLElement;
  icon: () => SVGElement;
}

export interface GuideHandle {
  /** Show this view's guide. The tip appears once per `id`, ever. */
  show: (id: string, content: GuideContent) => void;
}

const SEEN_KEY = "bui-guide-seen";
const TIP_STEPS = 2;
const TIP_MS = 9000;

const touchOnly = matchMedia("(hover: none) and (pointer: coarse)");

const readSeen = (): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
};

const markSeen = (id: string) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), id])]));
  } catch {
    // Private windows can refuse storage; the tip then shows again next visit.
  }
};

/** Stops a press, and the click it would become, from reaching anything else. */
export const swallowPress = (event: PointerEvent): void => {
  event.stopPropagation();
  event.preventDefault();
  const click = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };
  document.addEventListener("click", click, { capture: true, once: true });
  // A press that never becomes a click (a drag) mustn't leave the next real click swallowed.
  setTimeout(() => document.removeEventListener("click", click, true), 600);
};

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent?: HTMLElement) => {
  const el = document.createElement(tag);
  el.className = className;
  parent?.append(el);
  return el;
};

const stepRow = (step: GuideStep, parent: HTMLElement) => {
  const row = node("li", "bui-guide__step", parent);
  row.append(step.icon(), step.text);
};

export const createGuide = ({ parent, stage, icon }: GuideConfig): GuideHandle => {
  const details = node("details", "bui-guide", parent);
  const summary = node("summary", "canvas-btn bui-guide__button", details);
  // Icon only, so the canvas controls stay short; the name is still there for screen readers and on hover
  summary.append(icon());
  summary.setAttribute("aria-label", "Controls");
  summary.title = "Controls";
  const panel = node("div", "bui-guide__panel", details);

  const tip = node("div", "bui-guide__tip", stage);
  tip.setAttribute("role", "status");
  tip.hidden = true;
  let tipTimer = 0;
  let leaveTimer = 0;

  let current: GuideContent | null = null;
  let currentId: string | null = null;

  const render = () => {
    if (!current) return;
    panel.replaceChildren();
    node("p", "bui-guide__title", panel).textContent = current.title;
    const steps = node("ul", "bui-guide__steps", panel);
    (touchOnly.matches ? current.touch : current.pointer).forEach((step) => stepRow(step, steps));
    if (touchOnly.matches || current.keys.length === 0) return;
    node("p", "bui-guide__title", panel).textContent = "On a keyboard";
    const keys = node("ul", "bui-guide__keys", panel);
    for (const key of current.keys) {
      const row = node("li", "bui-guide__key", keys);
      const caps = node("span", "bui-guide__caps", row);
      key.keys.forEach((k) => (node("kbd", "", caps).textContent = k));
      row.append(key.text);
    }
  };

  const hideTip = () => {
    window.clearTimeout(tipTimer);
    if (tip.hidden || tip.classList.contains("bui-guide__tip--leaving")) return;
    tip.classList.add("bui-guide__tip--leaving");
    leaveTimer = window.setTimeout(() => {
      tip.hidden = true;
      tip.classList.remove("bui-guide__tip--leaving");
    }, 300);
  };

  // The first touch, scroll or key in the view means the reader has found their way in.
  for (const type of ["pointerdown", "wheel"] as const) {
    stage.addEventListener(type, hideTip, { passive: true });
  }
  document.addEventListener("keydown", (e) => {
    hideTip();
    if (e.key === "Escape") details.open = false;
  });
  // A press outside only closes the panel: caught before the view sees it, so it can't also pick something.
  document.addEventListener("pointerdown", (e) => {
    if (!details.open || details.contains(e.target as Node)) return;
    details.open = false;
    swallowPress(e);
  }, true);
  details.addEventListener("toggle", hideTip);
  touchOnly.addEventListener("change", render);

  return {
    show(id, content) {
      current = content;
      render();
      // Apps re-apply the same view (from the URL, a resize); only a real switch retires the tip.
      if (id === currentId) return;
      currentId = id;
      hideTip();
      if (readSeen().includes(id)) return;
      markSeen(id);
      const steps = touchOnly.matches ? content.touch : content.pointer;
      window.clearTimeout(leaveTimer);
      tip.classList.remove("bui-guide__tip--leaving");
      tip.replaceChildren();
      steps.slice(0, TIP_STEPS).forEach((step, i) => {
        if (i > 0) node("span", "bui-guide__dot", tip);
        const part = node("span", "bui-guide__part", tip);
        part.append(step.icon(), step.tip ?? step.text);
      });
      tip.hidden = false;
      tipTimer = window.setTimeout(hideTip, TIP_MS);
    },
  };
};
