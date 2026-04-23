/**
 * Header view toggle — injects a segmented control into the
 * bible-ui header's controls slot for switching between views.
 */

import { getView, setView, onViewChange } from "./viewState.ts";
import type { ViewMode } from "./viewState.ts";

const VIEWS: { mode: ViewMode; label: string }[] = [
  { mode: "timeline", label: "Timeline" },
  { mode: "lineage", label: "Lineage" },
  { mode: "narrative", label: "Narrative" },
];

export const initHeader = (controlsSlot: HTMLElement): void => {
  const toggle = document.createElement("div");
  toggle.className = "view-toggle";

  const buttons: HTMLButtonElement[] = [];

  for (const { mode, label } of VIEWS) {
    const btn = document.createElement("button");
    btn.className = "view-toggle__btn";
    btn.textContent = label;
    btn.dataset.view = mode;

    if (mode === getView()) {
      btn.classList.add("view-toggle__btn--active");
    }

    btn.addEventListener("click", () => setView(mode));
    toggle.appendChild(btn);
    buttons.push(btn);
  }

  controlsSlot.prepend(toggle);

  onViewChange((view) => {
    for (const btn of buttons) {
      btn.classList.toggle(
        "view-toggle__btn--active",
        btn.dataset.view === view,
      );
    }
  });
};
