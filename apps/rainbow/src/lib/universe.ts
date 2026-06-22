// Bible Universe — a 3D node-graph view of cross-references.
//
// Each verse that participates in at least one cross-reference becomes a star.
// Each of the 66 books is a "galaxy": a cone of stars radiating outward on a
// Fibonacci-sphere direction, ordered canonically (Genesis 1:1 near the core,
// the book's final verse at the tip) so every book reads as a glowing filament.
// Cross-references are the lines between stars; OT<->NT references are "bridges".
//
// The rendering core (point-sprite shader, additive glow, screen-space picking,
// orbit + fit tween) is ported from the Constellation viewer's ThreeView, with
// the React lifecycle stripped out in favour of a plain imperative handle.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { BOOKS, OT_COUNT } from '../data/books';
import { CATEGORY_COLORS } from '../data/categories';
import type { Reference } from './dataWorker';

export type ColorMode = 'category' | 'testament' | 'heat';
export type SizeMode = 'uniform' | 'connections';

export interface UniverseHandle {
  setColorMode(mode: ColorMode): void;
  setSizeMode(mode: SizeMode): void;
  setShowEdges(on: boolean): void;
  setBridgesOnly(on: boolean): void;
  setShowLabels(on: boolean): void;
  focusNode(id: number): void; // fly to + select a verse by node id
  clearSelection(): void;
  fit(): void;
  resize(): void;
  dispose(): void;
}

export interface UniverseCallbacks {
  onHover?(info: VerseInfo | null, screen: [number, number]): void;
  // neighbours are the verses this one links to, sorted by their own connection count
  onSelect?(info: VerseInfo | null, neighbours: VerseInfo[]): void;
}

export interface VerseInfo {
  id: number; // node index — pass back to focusNode() to fly there
  book: number;
  chapter: number;
  verse: number;
  degree: number;
  label: string; // "Genesis 1:1"
}

// ---- tunables (mirror the Constellation 3D look) ------------------------- //
const INK = new THREE.Color(0x6f7ea0); // faint cool hairline for the edge soup
const BRIDGE = new THREE.Color(0xffd166); // warm gold for OT<->NT crossings
const HILITE = new THREE.Color(0xffffff); // selected verse's own links
const TESTAMENT_OT = new THREE.Color(0x4a8cd0);
const TESTAMENT_NT = new THREE.Color(0xe0a857);
const BASE3D = 2.7; // smaller than Constellation's 3.4 — with ~18x the nodes, smaller
                    // dots (same glow shader) give each star room instead of bleeding together
const HIT_PAD = 8;
const EDGE_OPACITY = 0.035; // the full 63k-edge hairball is intentionally a faint mist
const BRIDGE_OPACITY = 0.22;
const REST_ALPHA = 0.85; // a star's normal opacity (matches Constellation)
const DIM_ALPHA = 0.2; // a star dimmed because another verse is in focus — kept as a soft backdrop, not blacked out
const FOCUS_MS = 850; // camera fly-to duration when a verse is selected
const FIT_MS = 900; // camera re-frame duration for the Fit button

// galaxy geometry — each book is a cone/tuft radiating from the centre along a
// Fibonacci-sphere direction (a "dandelion"); verses unspool outward in reading
// order, hub near the core and members splayed into the cone.
const R_IN = 26; // inner radius where a book's first verses sit
const R_OUT_BASE = 50; // base reach of a book's cone
const R_OUT_PER = 1.1; // cone grows with sqrt(verse count)
const R_OUT_CAP = 150; // longest cone reach
const CONE = 0.3; // tuft half-angle (radians)

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// cool -> warm density ramp (ported from the Constellation heat module)
const HEAT_STOPS: [number, [number, number, number]][] = [
  [0.0, [70, 86, 120]],
  [0.3, [143, 176, 224]],
  [0.55, [230, 238, 255]],
  [0.75, [240, 212, 154]],
  [1.0, [224, 168, 87]],
];
function heatRGB(t: number, out: THREE.Color) {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    if (x <= HEAT_STOPS[i][0]) {
      const [t0, c0] = HEAT_STOPS[i - 1];
      const [t1, c1] = HEAT_STOPS[i];
      const f = (x - t0) / (t1 - t0 || 1);
      out.setRGB(
        (c0[0] + (c1[0] - c0[0]) * f) / 255,
        (c0[1] + (c1[1] - c0[1]) * f) / 255,
        (c0[2] + (c1[2] - c0[2]) * f) / 255,
      );
      return;
    }
  }
  const l = HEAT_STOPS[HEAT_STOPS.length - 1][1];
  out.setRGB(l[0] / 255, l[1] / 255, l[2] / 255);
}

const vert = `
  uniform float uPixelRatio;
  uniform float uK;
  attribute vec3 aColor;
  attribute float size;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (uK / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float r = length(c) * 2.0;          // 0 center -> 1 edge
    if (r > 1.0) discard;
    float glow = pow(1.0 - r, 3.2);     // tight radial falloff (minimal halo)
    float core = smoothstep(0.45, 0.0, r); // crisp star core
    vec3 col = mix(vColor, vec3(1.0), core * 0.4);
    gl_FragColor = vec4(col, vAlpha * (glow * 0.46 + core * 0.78));
  }
`;

// ---- graph built from the reference list --------------------------------- //
interface Graph {
  n: number;
  book: Uint8Array;
  chapter: Uint16Array;
  verse: Uint16Array;
  degree: Float32Array;
  dominantCat: Uint8Array;
  nodeScale: Float32Array; // sqrt(degree) normalized to p95 -> ~[0.55, 2.6]
  edgeSi: Uint32Array;
  edgeTi: Uint32Array;
  edgeBridge: Uint8Array;
  adjacency: Uint32Array[]; // per-node neighbour edge indices (for select isolate)
}

function buildGraph(refs: Reference[]): Graph {
  const key = (b: number, c: number, v: number) => (b * 1000 + c) * 1000 + v;
  const index = new Map<number, number>();
  const bookL: number[] = [];
  const chL: number[] = [];
  const vL: number[] = [];

  const getId = (b: number, c: number, v: number) => {
    const k = key(b, c, v);
    let id = index.get(k);
    if (id === undefined) {
      id = bookL.length;
      index.set(k, id);
      bookL.push(b);
      chL.push(c);
      vL.push(v);
    }
    return id;
  };

  const m = refs.length;
  const edgeSi = new Uint32Array(m);
  const edgeTi = new Uint32Array(m);
  const edgeBridge = new Uint8Array(m);
  const edgeCat = new Uint8Array(m);
  for (let i = 0; i < m; i++) {
    const r = refs[i];
    const si = getId(r.s[0], r.s[1], r.s[2]);
    const ti = getId(r.t[0], r.t[1], r.t[2]);
    edgeSi[i] = si;
    edgeTi[i] = ti;
    edgeCat[i] = r.cat;
    const sOT = r.s[0] < OT_COUNT;
    const tOT = r.t[0] < OT_COUNT;
    edgeBridge[i] = sOT !== tOT ? 1 : 0;
  }

  const n = bookL.length;
  const book = Uint8Array.from(bookL);
  const chapter = Uint16Array.from(chL);
  const verse = Uint16Array.from(vL);
  const degree = new Float32Array(n);
  const catVotes = new Uint16Array(n * 8);
  const adjCount = new Uint32Array(n);
  for (let i = 0; i < m; i++) {
    const si = edgeSi[i];
    const ti = edgeTi[i];
    degree[si]++;
    degree[ti]++;
    adjCount[si]++;
    adjCount[ti]++;
    catVotes[si * 8 + edgeCat[i]]++;
    catVotes[ti * 8 + edgeCat[i]]++;
  }

  // dominant category per node (argmax of touching-edge categories)
  const dominantCat = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0;
    let bestV = -1;
    for (let c = 0; c < 8; c++) {
      const v = catVotes[i * 8 + c];
      if (v > bestV) {
        bestV = v;
        best = c;
      }
    }
    dominantCat[i] = best;
  }

  // size-by-degree, normalized to the 95th percentile (sqrt-compressed)
  const sorted = Float32Array.from(degree).sort();
  const p95 = sorted[Math.floor(n * 0.95)] || 1;
  const nodeScale = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    nodeScale[i] = 0.55 + 2.05 * Math.sqrt(Math.min(1, degree[i] / p95));
  }

  // adjacency lists for select-to-isolate (edge indices touching each node)
  const adjacency: Uint32Array[] = new Array(n);
  for (let i = 0; i < n; i++) adjacency[i] = new Uint32Array(adjCount[i]);
  const cursor = new Uint32Array(n);
  for (let i = 0; i < m; i++) {
    const si = edgeSi[i];
    const ti = edgeTi[i];
    adjacency[si][cursor[si]++] = i;
    adjacency[ti][cursor[ti]++] = i;
  }

  return {
    n, book, chapter, verse, degree, dominantCat, nodeScale,
    edgeSi, edgeTi, edgeBridge, adjacency,
  };
}

// ---- book-galaxy layout (radiating dandelion) ---------------------------- //
function computeLayout(g: Graph): { pos: Float32Array; labelPos: Map<number, [number, number, number]> } {
  const { n } = g;
  const pos = new Float32Array(n * 3);
  const labelPos = new Map<number, [number, number, number]>();

  // group node ids by book, then sort each book's verses canonically so the
  // book unspools from the core outward in reading order
  const byBook: number[][] = Array.from({ length: 66 }, () => []);
  for (let i = 0; i < n; i++) byBook[g.book[i]].push(i);
  for (const ids of byBook) {
    ids.sort((a, b) => g.chapter[a] - g.chapter[b] || g.verse[a] - g.verse[b]);
  }

  const golden = Math.PI * (3 - Math.sqrt(5));
  type V3 = [number, number, number];
  const cross = (a: V3, b: V3): V3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const norm = (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };

  for (let b = 0; b < 66; b++) {
    // Fibonacci direction, indexed in canonical book order so neighbouring
    // books sit near each other on the sphere
    const y = 1 - (b / 65) * 2;
    const rxy = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = b * golden;
    const dir = norm([Math.cos(theta) * rxy, y, Math.sin(theta) * rxy]);
    const ref: V3 = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = norm(cross(dir, ref));
    const v = cross(dir, u);

    const ids = byBook[b];
    const m = ids.length;
    const rOut = Math.min(R_OUT_BASE + Math.sqrt(m) * R_OUT_PER, R_OUT_CAP);

    for (let j = 0; j < m; j++) {
      const i = ids[j];
      const t = m > 1 ? j / (m - 1) : 0; // canonical position 0..1
      const radius = R_IN + t * (rOut - R_IN);
      const rnd = mulberry32((i + 1) * 0x9e3779b1);
      const half = CONE * (radius / rOut); // fan wider toward the tips
      const off = half * Math.sqrt(rnd());
      const az = rnd() * Math.PI * 2;
      const ca = Math.cos(off);
      const sa = Math.sin(off);
      const dx = dir[0] * ca + (u[0] * Math.cos(az) + v[0] * Math.sin(az)) * sa;
      const dy = dir[1] * ca + (u[1] * Math.cos(az) + v[1] * Math.sin(az)) * sa;
      const dz = dir[2] * ca + (u[2] * Math.cos(az) + v[2] * Math.sin(az)) * sa;
      pos[3 * i] = dx * radius;
      pos[3 * i + 1] = dy * radius;
      pos[3 * i + 2] = dz * radius;
    }

    const lr = rOut + 10;
    labelPos.set(b, [dir[0] * lr, dir[1] * lr, dir[2] * lr]);
  }

  return { pos, labelPos };
}

// ---- the view ------------------------------------------------------------ //
export function createUniverse(
  container: HTMLElement,
  refs: Reference[],
  cb: UniverseCallbacks = {},
): UniverseHandle {
  const g = buildGraph(refs);
  const { pos, labelPos } = computeLayout(g);
  const n = g.n;

  // bounding sphere for framing
  const cen = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    cen.x += pos[3 * i];
    cen.y += pos[3 * i + 1];
    cen.z += pos[3 * i + 2];
  }
  cen.multiplyScalar(1 / n);
  let radius = 1;
  for (let i = 0; i < n; i++) {
    radius = Math.max(radius, Math.hypot(
      pos[3 * i] - cen.x, pos[3 * i + 1] - cen.y, pos[3 * i + 2] - cen.z));
  }
  const FOV = 50;
  const fitDist = (radius / Math.sin((FOV / 2) * (Math.PI / 180))) * 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 4000);
  // the disk lies in the X-Z plane (normal = world up), so view it from an
  // elevated angle — tilted like a galaxy photo, not edge-on
  const restView = new THREE.Vector3(0, fitDist * 0.62, fitDist * 0.78);
  camera.position.copy(cen).add(restView);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x05070d, 1);
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(cen);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = -0.4; // spin so the spiral arms trail (the natural galaxy direction)
  controls.minDistance = 20;
  controls.maxDistance = 2200;
  // Left-drag orbits; right-drag (or two-finger) pans across the X/Y plane;
  // wheel/pinch dollies. screenSpacePanning keeps panning aligned to the screen.
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.panSpeed = 0.9;
  controls.zoomSpeed = 0.9;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  // arrow keys pan across X/Y too (trackpad-friendly, no right mouse button needed)
  controls.keyPanSpeed = 24;
  controls.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
  controls.listenToKeyEvents(renderer.domElement);
  renderer.domElement.tabIndex = 0; // focusable so it receives the key events

  // points
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const colorAttr = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  geom.setAttribute('aColor', colorAttr);
  const sizeArr = new Float32Array(n);
  for (let i = 0; i < n; i++) sizeArr[i] = BASE3D * g.nodeScale[i];
  geom.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));
  const alphaAttr = new THREE.BufferAttribute(new Float32Array(n).fill(REST_ALPHA), 1);
  geom.setAttribute('aAlpha', alphaAttr);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPixelRatio: { value: renderer.getPixelRatio() },
      uK: { value: 2 * fitDist },
    },
  });
  const points = new THREE.Points(geom, mat);
  scene.add(points);

  // edges: all-vs-bridges built once, toggled by visibility
  function buildLines(filter: (i: number) => boolean, color: THREE.Color, opacity: number) {
    let count = 0;
    for (let i = 0; i < g.edgeSi.length; i++) if (filter(i)) count++;
    const arr = new Float32Array(count * 6);
    let o = 0;
    for (let i = 0; i < g.edgeSi.length; i++) {
      if (!filter(i)) continue;
      const a = g.edgeSi[i] * 3;
      const b = g.edgeTi[i] * 3;
      arr[o] = pos[a]; arr[o + 1] = pos[a + 1]; arr[o + 2] = pos[a + 2];
      arr[o + 3] = pos[b]; arr[o + 4] = pos[b + 1]; arr[o + 5] = pos[b + 2];
      o += 6;
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const lm = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    return new THREE.LineSegments(lg, lm);
  }
  const edgesObj = buildLines(() => true, INK, EDGE_OPACITY);
  const bridgesObj = buildLines((i) => g.edgeBridge[i] === 1, BRIDGE, BRIDGE_OPACITY);
  edgesObj.visible = false; // start clean — connections reveal on click; toggle for the global web
  bridgesObj.visible = false;
  scene.add(edgesObj);
  scene.add(bridgesObj);

  // ---- camera tween (shared by Fit and verse-focus) ---- //
  let camAnim: {
    t0: number; dur: number; resumeAuto: boolean;
    fromPos: THREE.Vector3; fromTarget: THREE.Vector3;
    toPos: THREE.Vector3; toTarget: THREE.Vector3;
  } | null = null;
  function startCamTween(toTarget: THREE.Vector3, toPos: THREE.Vector3, dur: number, resumeAuto: boolean) {
    camAnim = {
      t0: performance.now(), dur, resumeAuto,
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos, toTarget,
    };
    controls.autoRotate = false;
  }

  // ---- selection: highlight a verse's links, dim the rest, fly to it ---- //
  let hiliteObj: THREE.LineSegments | null = null;
  let selected = -1;
  function clearHilite() {
    if (hiliteObj) {
      scene.remove(hiliteObj);
      hiliteObj.geometry.dispose();
      (hiliteObj.material as THREE.Material).dispose();
      hiliteObj = null;
    }
  }
  // unique neighbour node ids (the other endpoint of each touching edge)
  function neighbourIds(node: number): number[] {
    const edges = g.adjacency[node];
    const set = new Set<number>();
    for (let k = 0; k < edges.length; k++) {
      const e = edges[k];
      const other = g.edgeSi[e] === node ? g.edgeTi[e] : g.edgeSi[e];
      set.add(other);
    }
    set.delete(node);
    return [...set];
  }
  function applySelect(node: number, fly: boolean): VerseInfo[] {
    selected = node;
    const neigh = neighbourIds(node);
    const inFocus = new Set(neigh);
    inFocus.add(node);

    // dim everything that isn't the verse or one of its connections
    for (let i = 0; i < n; i++) {
      alphaAttr.setX(i, i === node ? 1 : inFocus.has(i) ? REST_ALPHA : DIM_ALPHA);
    }
    alphaAttr.needsUpdate = true;

    // white links from the verse to each connection
    clearHilite();
    const arr = new Float32Array(neigh.length * 6);
    const a = node * 3;
    for (let k = 0; k < neigh.length; k++) {
      const b = neigh[k] * 3;
      arr[k * 6] = pos[a]; arr[k * 6 + 1] = pos[a + 1]; arr[k * 6 + 2] = pos[a + 2];
      arr[k * 6 + 3] = pos[b]; arr[k * 6 + 4] = pos[b + 1]; arr[k * 6 + 5] = pos[b + 2];
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    hiliteObj = new THREE.LineSegments(
      lg, new THREE.LineBasicMaterial({ color: HILITE, transparent: true, opacity: 0.5, depthWrite: false }));
    scene.add(hiliteObj);

    if (fly) {
      const focus = new THREE.Vector3(pos[a], pos[a + 1], pos[a + 2]);
      const dir = camera.position.clone().sub(controls.target).normalize();
      const dist = Math.min(controls.maxDistance, Math.max(120, radius * 0.42));
      startCamTween(focus, focus.clone().addScaledVector(dir, dist), FOCUS_MS, false);
    } else {
      controls.autoRotate = false;
    }

    // neighbours sorted by their own connection count (most-linked first)
    return neigh
      .sort((x, y) => g.degree[y] - g.degree[x])
      .map((i) => infoFor(i));
  }
  function clearSelection() {
    selected = -1;
    clearHilite();
    for (let i = 0; i < n; i++) alphaAttr.setX(i, REST_ALPHA);
    alphaAttr.needsUpdate = true;
    controls.autoRotate = true;
  }

  // floating book labels at each galaxy's tip
  const labelObjs: CSS2DObject[] = [];
  for (let b = 0; b < 66; b++) {
    const anchor = labelPos.get(b);
    if (!anchor) continue;
    const el = document.createElement('div');
    el.className = 'universe-label';
    el.textContent = BOOKS[b].name;
    el.style.color = BOOKS[b].testament === 'OT' ? '#9bb8e0' : '#e8c98a';
    const obj = new CSS2DObject(el);
    obj.position.set(anchor[0], anchor[1], anchor[2]);
    scene.add(obj);
    labelObjs.push(obj);
  }

  // ---- color application ---- //
  let colorMode: ColorMode = 'category';
  // precompute degree heat (log-scaled) for the heat mode
  const logMax = Math.log(Math.max(...g.degree) + 1) || 1;
  function applyColors() {
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      if (colorMode === 'heat') {
        heatRGB(Math.log(g.degree[i] + 1) / logMax, col);
      } else if (colorMode === 'testament') {
        col.copy(g.book[i] < OT_COUNT ? TESTAMENT_OT : TESTAMENT_NT);
      } else {
        col.set(CATEGORY_COLORS[g.dominantCat[i]]);
      }
      colorAttr.setXYZ(i, col.r, col.g, col.b);
    }
    colorAttr.needsUpdate = true;
  }
  applyColors();

  // ---- screen-space picking (matches rendered gl_PointSize) ---- //
  const uK = 2 * fitDist;
  const wv = new THREE.Vector3();
  let hovered = -1;
  function pick(ev: PointerEvent): number {
    const rect = renderer.domElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!w || !h) return -1;
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      wv.set(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]);
      const depth = camera.position.distanceTo(wv);
      wv.project(camera);
      if (wv.z < -1 || wv.z > 1) continue;
      const sx = (wv.x * 0.5 + 0.5) * w;
      const sy = (-wv.y * 0.5 + 0.5) * h;
      const d = Math.hypot(sx - cx, sy - cy);
      const r = 0.5 * sizeArr[i] * (uK / depth) + HIT_PAD;
      if (d <= r && d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  function infoFor(i: number): VerseInfo {
    return {
      id: i,
      book: g.book[i],
      chapter: g.chapter[i],
      verse: g.verse[i],
      degree: g.degree[i],
      label: `${BOOKS[g.book[i]].name} ${g.chapter[i]}:${g.verse[i]}`,
    };
  }
  function onMove(ev: PointerEvent) {
    const idx = pick(ev);
    if (idx !== hovered) {
      hovered = idx;
      // pause the ambient spin while pointing at a star (unless a verse is pinned)
      if (selected < 0) controls.autoRotate = idx < 0;
      renderer.domElement.style.cursor = idx >= 0 ? 'pointer' : 'grab';
    }
    const rect = container.getBoundingClientRect();
    cb.onHover?.(idx >= 0 ? infoFor(idx) : null, [ev.clientX - rect.left, ev.clientY - rect.top]);
  }
  let downPos: [number, number] = [0, 0];
  function onDown(ev: PointerEvent) { downPos = [ev.clientX, ev.clientY]; }
  function onClick(ev: PointerEvent) {
    if (Math.hypot(ev.clientX - downPos[0], ev.clientY - downPos[1]) > 5) return; // a drag
    const idx = pick(ev);
    if (idx >= 0) {
      cb.onSelect?.(infoFor(idx), applySelect(idx, true));
    } else {
      clearSelection();
      cb.onSelect?.(null, []);
    }
  }
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('click', onClick);

  // ---- resize ---- //
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }
  resize();

  // ---- fit: re-frame the whole universe and drop any selection ---- //
  function fit() {
    clearSelection();
    startCamTween(cen.clone(), cen.clone().add(restView), FIT_MS, true);
  }

  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const ca = camAnim;
    const ck = ca ? easeInOutCubic(Math.min(1, (performance.now() - ca.t0) / ca.dur)) : 0;
    if (ca) controls.target.lerpVectors(ca.fromTarget, ca.toTarget, ck);
    controls.update();
    if (ca) {
      camera.position.lerpVectors(ca.fromPos, ca.toPos, ck);
      if (ck >= 1) { controls.autoRotate = ca.resumeAuto; camAnim = null; }
    }
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };
  loop();

  const sizeAttr = geom.getAttribute('size') as THREE.BufferAttribute;
  return {
    setColorMode(mode) { colorMode = mode; applyColors(); },
    setSizeMode(mode) {
      for (let i = 0; i < n; i++) {
        sizeAttr.setX(i, mode === 'uniform' ? BASE3D * 1.05 : BASE3D * g.nodeScale[i]);
      }
      sizeAttr.needsUpdate = true;
    },
    setShowEdges(on) { edgesObj.visible = on && !bridgesObj.visible; },
    setBridgesOnly(on) {
      bridgesObj.visible = on;
      edgesObj.visible = !on;
    },
    setShowLabels(on) { labelObjs.forEach((o) => (o.visible = on)); },
    focusNode(id) {
      if (id < 0 || id >= n) return;
      const neigh = applySelect(id, true);
      cb.onSelect?.(infoFor(id), neigh);
    },
    clearSelection,
    fit,
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      clearHilite();
      geom.dispose();
      mat.dispose();
      edgesObj.geometry.dispose();
      (edgesObj.material as THREE.Material).dispose();
      bridgesObj.geometry.dispose();
      (bridgesObj.material as THREE.Material).dispose();
      labelObjs.forEach((o) => o.element.remove());
      renderer.dispose();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
    },
  };
}
