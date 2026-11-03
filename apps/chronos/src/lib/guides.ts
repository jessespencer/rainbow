/**
 * What the Controls guide says for each Chronos view.
 */

import {
  createElement, Hand, Mouse, MousePointer2, MousePointerClick, MoveHorizontal, Pointer, ZoomIn,
  type IconNode,
} from "lucide";
import type { GuideContent, GuideKey } from "@jessespencer/bible-ui/guide";
import type { ViewMode } from "./viewState.ts";

const icon = (node: IconNode) => () => createElement(node);

export const guideFor = (view: ViewMode, isMac: boolean): GuideContent => {
  const modifier = isMac ? "⌘" : "Ctrl";
  const keys: GuideKey[] = [
    { keys: [modifier, "K"], text: "Find a person, a year or an era" },
    { keys: ["←", "→"], text: "Step to the previous or next life, or move the year" },
    { keys: ["+", "−"], text: "Zoom in and out" },
    { keys: ["Esc"], text: "Clear the selection" },
  ];
  const zoomStep = {
    icon: icon(ZoomIn),
    text: `Hold ${modifier} and scroll, or pinch the trackpad, to zoom`,
    tip: "Pinch to zoom",
  };

  if (view === "lineage") {
    return {
      title: "Following the lineage",
      pointer: [
        { icon: icon(MousePointer2), text: "Hover a name to trace their line", tip: "Hover a name to trace their line" },
        { icon: icon(MousePointerClick), text: "Click a name to read their story", tip: "Click to read" },
        { icon: icon(Mouse), text: "Scroll to follow the generations" },
        zoomStep,
      ],
      touch: [
        { icon: icon(Pointer), text: "Tap a name to read their story", tip: "Tap a name to read" },
        { icon: icon(Hand), text: "Drag to follow the generations", tip: "Drag to move" },
        { icon: icon(ZoomIn), text: "Pinch to zoom" },
      ],
      keys,
    };
  }

  return {
    title: "Exploring the timeline",
    pointer: [
      { icon: icon(MousePointerClick), text: "Click a life to read their story", tip: "Click a life to read it" },
      { icon: icon(Mouse), text: "Scroll to move through time", tip: "Scroll to move through time" },
      zoomStep,
      { icon: icon(MoveHorizontal), text: "Drag across the lanes to see who was alive in any year" },
    ],
    touch: [
      { icon: icon(Pointer), text: "Tap a life to read their story", tip: "Tap a life to read it" },
      { icon: icon(Hand), text: "Drag to move through time", tip: "Drag to move" },
      { icon: icon(ZoomIn), text: "Pinch to zoom" },
      { icon: icon(MoveHorizontal), text: "Slide along the year strip to see who was alive" },
    ],
    keys,
  };
};
