/**
 * View state — simple pub/sub for toggling between Timeline and Lineage views.
 */

export type ViewMode = "timeline" | "lineage";

type Listener = (view: ViewMode) => void;

let current: ViewMode = "timeline";
const listeners: Listener[] = [];

export const getView = (): ViewMode => current;

export const setView = (view: ViewMode): void => {
  if (view === current) return;
  current = view;
  for (const fn of listeners) fn(current);
};

export const onViewChange = (fn: Listener): void => {
  listeners.push(fn);
};
