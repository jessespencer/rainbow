export type SheetState = 'peek' | 'full';

const DRAG_SLOP_PX = 4;
const CLOSE_DRAG_PX = 110;
const EXPAND_DRAG_PX = 60;

export interface SheetHandle {
  reset(): void;
}

// On phones the companion is a bottom sheet with two heights, dragged by its handle.
// Above the phone breakpoint CSS docks it and this stays out of the way.
export function setupSheet(
  panel: HTMLElement,
  handle: HTMLElement,
  onClose: () => void,
): SheetHandle {
  let state: SheetState = 'peek';
  let startY: number | null = null;
  let dragged = 0;

  const setState = (next: SheetState) => {
    state = next;
    panel.dataset.sheet = next;
  };

  const release = () => {
    startY = null;
    panel.classList.remove('dragging');
    panel.style.removeProperty('--drag');
  };

  handle.addEventListener('pointerdown', (e) => {
    startY = e.clientY;
    dragged = 0;
    handle.setPointerCapture(e.pointerId);
    panel.classList.add('dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    dragged = e.clientY - startY;
    panel.style.setProperty('--drag', `${dragged}px`);
  });

  handle.addEventListener('pointerup', () => {
    const distance = dragged;
    release();
    if (Math.abs(distance) < DRAG_SLOP_PX) {
      setState(state === 'peek' ? 'full' : 'peek');
    } else if (state === 'peek' && distance > CLOSE_DRAG_PX) {
      onClose();
    } else if (state === 'peek' && distance < -EXPAND_DRAG_PX) {
      setState('full');
    } else if (state === 'full' && distance > EXPAND_DRAG_PX) {
      setState('peek');
    }
  });

  handle.addEventListener('pointercancel', release);

  return { reset: () => setState('peek') };
}
