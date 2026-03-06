export interface CanvasManager {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  resize: () => void;
}

export function createCanvasManager(canvas: HTMLCanvasElement): CanvasManager {
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const container = canvas.parentElement!;
    const rect = container.getBoundingClientRect();
    manager.width = rect.width;
    manager.height = rect.height;
    manager.dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * manager.dpr;
    canvas.height = rect.height * manager.dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(manager.dpr, 0, 0, manager.dpr, 0, 0);
  }

  const manager: CanvasManager = { canvas, ctx, width: 0, height: 0, dpr, resize };
  resize();
  return manager;
}

export function clearCanvas(cm: CanvasManager) {
  cm.ctx.save();
  cm.ctx.setTransform(cm.dpr, 0, 0, cm.dpr, 0, 0);
  cm.ctx.clearRect(0, 0, cm.width, cm.height);
  cm.ctx.fillStyle = '#1a1a2e';
  cm.ctx.fillRect(0, 0, cm.width, cm.height);
  cm.ctx.restore();
}
