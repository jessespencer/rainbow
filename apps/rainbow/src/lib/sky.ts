/**
 * The starfield behind Arcs and Galaxy: three layers of soft, dim stars, each a repeating tile
 * painted once. It stays still. The views above draw with transparent backgrounds and let it
 * show through where they're empty.
 */

interface Layer {
  /** Tile size in CSS pixels; each layer's differs so the repeats never line up. */
  tile: number;
  stars: number;
  radius: [number, number];
  alpha: [number, number];
}

const LAYERS: Layer[] = [
  { tile: 433, stars: 22, radius: [0.45, 0.7], alpha: [0.1, 0.22] },
  { tile: 557, stars: 12, radius: [0.6, 0.95], alpha: [0.16, 0.3] },
  { tile: 683, stars: 5, radius: [0.85, 1.25], alpha: [0.24, 0.4] },
];

// Mostly cool white, with the odd warm or blue star.
const TINTS = ['214, 226, 255', '214, 226, 255', '214, 226, 255', '255, 232, 204', '176, 200, 255'];

const MAX_DPR = 2;

// A small seeded generator, so the sky is the same on every visit.
function random(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintTile(layer: Layer, seed: number, dpr: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.round(layer.tile * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const next = random(seed);
  const between = ([low, high]: [number, number]) => low + (high - low) * next();
  for (let i = 0; i < layer.stars; i++) {
    const x = next() * layer.tile;
    const y = next() * layer.tile;
    const r = between(layer.radius);
    const a = between(layer.alpha);
    const tint = TINTS[Math.floor(next() * TINTS.length)];
    // A faint halo, then a soft core, so a star reads as light rather than a stuck pixel.
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    halo.addColorStop(0, `rgba(${tint}, ${a * 0.35})`);
    halo.addColorStop(1, `rgba(${tint}, 0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    const core = ctx.createRadialGradient(x, y, 0, x, y, r);
    core.addColorStop(0, `rgba(${tint}, ${a})`);
    core.addColorStop(1, `rgba(${tint}, ${a * 0.4})`);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas.toDataURL();
}

export function createSky(container: HTMLElement): void {
  const sky = document.createElement('div');
  sky.id = 'sky';
  sky.setAttribute('aria-hidden', 'true');
  container.prepend(sky);

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  LAYERS.forEach((layer, index) => {
    const el = document.createElement('div');
    el.className = 'sky-layer';
    el.style.backgroundImage = `url(${paintTile(layer, 7919 * (index + 1), dpr)})`;
    el.style.backgroundSize = `${layer.tile}px ${layer.tile}px`;
    sky.append(el);
  });
}
