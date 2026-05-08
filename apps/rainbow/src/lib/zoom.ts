import { zoom, zoomIdentity, type ZoomBehavior, type D3ZoomEvent } from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';

export interface ZoomState {
  behavior: ZoomBehavior<HTMLCanvasElement, unknown>;
  k: number;
  tx: number;
  ty: number;
}

export function setupZoom(
  canvas: HTMLCanvasElement,
  onZoom: (k: number, tx: number, ty: number) => void,
): ZoomState {
  const state: ZoomState = {
    behavior: null!,
    k: 1,
    tx: 0,
    ty: 0,
  };

  state.behavior = zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.3, 20])
    .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      state.k = event.transform.k;
      state.tx = event.transform.x;
      state.ty = event.transform.y;
      onZoom(state.k, state.tx, state.ty);
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
