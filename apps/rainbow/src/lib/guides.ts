import {
  createElement, Hand, Mouse, MousePointer2, MousePointerClick, MoveHorizontal, Pointer, Rotate3d, ZoomIn,
  type IconNode,
} from 'lucide';
import type { GuideContent, GuideKey } from '@jessespencer/bible-ui/guide';

export type GuideView = 'arcs' | 'heatmap' | 'galaxy';

const icon = (node: IconNode) => () => createElement(node);

// What each view's canvas says to a screen reader.
export const CANVAS_LABELS: Record<Exclude<GuideView, 'galaxy'>, string> = {
  arcs: 'Arc diagram of every cross-reference from Genesis to Revelation. Scroll or press plus and minus to zoom, drag to pan, click an arc to read both passages, and press Escape to clear.',
  heatmap: 'Heatmap of how strongly each pair of books is tied together. Click a cell to read the strongest link between two books.',
};

export function guideFor(view: GuideView, isMac: boolean): GuideContent {
  const keys: GuideKey[] = [
    { keys: [isMac ? '⌘' : 'Ctrl', 'K'], text: 'Search for a passage' },
    { keys: ['←', '→'], text: 'Step to the previous or next verse, chapter or link' },
    ...(view === 'heatmap' ? [] : [{ keys: ['+', '−'], text: 'Zoom in and out' }]),
    { keys: ['Esc'], text: 'Clear the selection and filters' },
  ];

  if (view === 'galaxy') {
    return {
      title: 'Exploring the galaxy',
      pointer: [
        { icon: icon(MousePointerClick), text: 'Click a star to light up every verse it connects to', tip: 'Click a star to see its links' },
        { icon: icon(Rotate3d), text: 'Drag to turn the galaxy', tip: 'Drag to turn it' },
        { icon: icon(Mouse), text: 'Scroll to fly in among the stars' },
      ],
      touch: [
        { icon: icon(Pointer), text: 'Tap a star to light up its connections', tip: 'Tap a star to see its links' },
        { icon: icon(Rotate3d), text: 'Drag to turn the galaxy', tip: 'Drag to turn it' },
        { icon: icon(ZoomIn), text: 'Pinch to fly in among the stars' },
      ],
      keys,
    };
  }

  if (view === 'heatmap') {
    return {
      title: 'Reading the heatmap',
      pointer: [
        { icon: icon(MousePointer2), text: 'Hover a cell to see how two books connect', tip: 'Hover a cell to compare two books' },
        { icon: icon(MousePointerClick), text: 'Click a cell to read the strongest link between them', tip: 'Click to read' },
      ],
      touch: [
        { icon: icon(Pointer), text: 'Tap a cell to read the strongest link between two books', tip: 'Tap a cell to read' },
      ],
      keys,
    };
  }

  return {
    title: 'Exploring the arcs',
    pointer: [
      { icon: icon(MousePointerClick), text: 'Click an arc to read both passages side by side', tip: 'Click an arc to read it' },
      { icon: icon(Mouse), text: 'Scroll to zoom from books to chapters to single verses', tip: 'Scroll to zoom' },
      { icon: icon(Hand), text: 'Drag to pan across the canon' },
      { icon: icon(MoveHorizontal), text: 'Hover the book strip to preview a passage, and click to read it' },
    ],
    touch: [
      { icon: icon(Pointer), text: 'Tap an arc to read both passages', tip: 'Tap an arc to read it' },
      { icon: icon(ZoomIn), text: 'Pinch to zoom from books down to single verses', tip: 'Pinch to zoom' },
      { icon: icon(Hand), text: 'Drag to pan across the canon' },
      { icon: icon(MoveHorizontal), text: 'Slide a finger along the book strip to preview passages' },
    ],
    keys,
  };
}
