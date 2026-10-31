import { zoom, zoomIdentity, type ZoomBehavior, type D3ZoomEvent } from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';

export interface ZoomState {
  behavior: ZoomBehavior<HTMLCanvasElement, unknown>;
  k: number;
  tx: number;
  ty: number;
  // Where the baseline stays while the reader zooms, so the axis never leaves the screen.
  baselineY: number | null;
}

export function setupZoom(
  canvas: HTMLCanvasElement,
  onZoom: (byUser: boolean) => void,
  allowsGesture: (event: TouchEvent) => boolean,
): ZoomState {
  const state: ZoomState = {
    behavior: null!,
    k: 1,
    tx: 0,
    ty: 0,
    baselineY: null,
  };

  state.behavior = zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.1, 800])
    .clickDistance(6)
    .filter((event: MouseEvent | TouchEvent) => {
      if (event.type === 'touchstart') return allowsGesture(event as TouchEvent);
      return (!event.ctrlKey || event.type === 'wheel') && !(event as MouseEvent).button;
    })
    .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      state.k = event.transform.k;
      state.tx = event.transform.x;
      const byUser = event.sourceEvent !== null && event.sourceEvent !== undefined;
      state.ty = byUser && state.baselineY !== null ? state.baselineY : event.transform.y;
      onZoom(byUser);
    });

  select(canvas).call(state.behavior);
  return state;
}

export function zoomTo(
  canvas: HTMLCanvasElement,
  zoomState: ZoomState,
  k: number, tx: number, ty: number,
  animated = true,
) {
  const sel = select(canvas);
  const transform = zoomIdentity.translate(tx, ty).scale(k);
  if (animated) {
    sel.transition().duration(750).call(zoomState.behavior.transform, transform);
  } else {
    sel.call(zoomState.behavior.transform, transform);
  }
}
