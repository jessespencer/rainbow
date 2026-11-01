import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BOOKS, TOTAL_BOOKS } from '../data/books';
import { BOOK_GENRE, GENRES } from '../data/genres';
import { MAX_DPR } from './arcGl';
import { linkFrom, linkToEnd, linkToStart, type LinkStore } from './links';
import { OT_VERSES, TOTAL_VERSES, VERSE_BOOK } from './verses';

export type ColorMode = 'genre' | 'testament' | 'heat' | 'book';
export type SizeMode = 'uniform' | 'connections';

export interface GalaxyOptions {
  links: boolean;
  bridgesOnly: boolean;
  labels: boolean;
  color: ColorMode;
  size: SizeMode;
}

// The verses to frame, and the links that fan out from them, strongest first.
export interface GalaxyFocus {
  ranges: [number, number][];
  links: Int32Array;
}

export interface GalaxyCallbacks {
  onHover(verse: number | null, connections: number, x: number, y: number): void;
  onSelect(verse: number | null): void;
}

export interface GalaxyHandle {
  setLinks(visible: Int32Array, genre: number | null): void;
  setFocus(focus: GalaxyFocus | null): void;
  setHighlight(link: number | null): void;
  setOptions(options: GalaxyOptions): void;
  setInset(pixels: number): void;
  drawCount(): { drawn: number; total: number };
  flyToFocus(): void;
  fit(): void;
  resize(): void;
  setActive(active: boolean): void;
}

// Colors go to the screen exactly as the genre table writes them.
THREE.ColorManagement.enabled = false;

// Links arrive strongest first, so a cap keeps the ones readers rate highest.
const EDGE_CAP = 6000;
const FOCUS_EDGE_CAP = 4000;

// A narrow lens from further back keeps the near rim from swelling past the far one.
const FOV = 32;
const FIT_WIDTH = 1.08;
const FIT_HEIGHT = 0.72;
const VISUAL_RADIUS = 0.8;
const BASE_SIZE = 2.2;
const FOCUS_SIZE = 4;
const FOCUS_SMALL_VERSES = 200;
const HIT_PAD_MOUSE = 8;
const HIT_PAD_TOUCH = 14;
const DRAG_SLOP_PX = 5;
const REST_ALPHA = 0.7;
const DIM_ALPHA = 0.045;
const EDGE_OPACITY = 0.1;
const FOCUS_EDGE_LIGHT = 90;
const FOCUS_MS = 850;
const FIT_MS = 900;
const INTRO_MS = 1800;
const SHIFT_EASE = 0.18;
const AUTO_ROTATE_SPEED = -0.4;
const SELECTED_LABEL_OFFSETS = [0, -28, 28, -56, 56];

// A flat two-arm spiral: the Testaments unwind from the bulge in reading order.
const R_CORE = 10;
const R_RIM = 150;
const ARM_WRAPS = 1.1;
const ARM_WIDTH = 4.8;
const DISK_THICKNESS = 3;
const BULGE = 3;
const BULGE_FALLOFF = 0.045;

const WHITE = new THREE.Color(0xffffff);
const TESTAMENT_OT = new THREE.Color(0x4a8cd0);
const TESTAMENT_NT = new THREE.Color(0xe0a857);
const GENRE_COLORS = GENRES.map(genre => new THREE.Color(genre.color));
// Neighboring books stay separable by alternating lightness along the rainbow.
const BOOK_COLORS = BOOKS.map((_, i) =>
  new THREE.Color().setHSL(i / TOTAL_BOOKS, 0.62, 0.6 + (i % 2 ? 0.07 : -0.07)));

const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [70, 86, 120]],
  [0.3, [143, 176, 224]],
  [0.55, [230, 238, 255]],
  [0.75, [240, 212, 154]],
  [1, [224, 168, 87]],
];

const VERTEX_SHADER = `
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

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (r > 1.0) discard;
    float glow = pow(1.0 - r, 3.2);
    float core = smoothstep(0.45, 0.0, r);
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.4), vAlpha * (glow * 0.46 + core * 0.78));
  }
`;

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function heatColor(t: number, out: THREE.Color) {
  const x = Math.max(0, Math.min(1, t));
  const i = Math.max(1, HEAT_STOPS.findIndex(([stop]) => x <= stop));
  const [t0, c0] = HEAT_STOPS[i - 1];
  const [t1, c1] = HEAT_STOPS[i];
  const f = (x - t0) / (t1 - t0);
  out.setRGB(
    (c0[0] + (c1[0] - c0[0]) * f) / 255,
    (c0[1] + (c1[1] - c0[1]) * f) / 255,
    (c0[2] + (c1[2] - c0[2]) * f) / 255,
  );
}

// Star positions are indexed by verse, so a verse id is also its star id.
function layoutStars(): Float32Array {
  const pos = new Float32Array(TOTAL_VERSES * 3);
  const gauss = (rnd: () => number) => (rnd() + rnd() + rnd() - 1.5) * 0.95;

  for (let verse = 0; verse < TOTAL_VERSES; verse++) {
    const nt = verse >= OT_VERSES;
    const armLength = nt ? TOTAL_VERSES - OT_VERSES : OT_VERSES;
    const p = (nt ? verse - OT_VERSES : verse) / (armLength - 1);
    const r = R_CORE + (R_RIM - R_CORE) * Math.sqrt(p);
    const theta = (nt ? Math.PI : 0) - ARM_WRAPS * 2 * Math.PI * p;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    const rnd = mulberry32((verse + 1) * 0x9e3779b1);
    const puff = 1 + BULGE * Math.exp(-p / BULGE_FALLOFF);
    const radial = r + gauss(rnd) * ARM_WIDTH * puff;
    const tangent = gauss(rnd) * ARM_WIDTH * puff * 0.5;
    pos[verse * 3] = cos * radial - sin * tangent;
    pos[verse * 3 + 1] = gauss(rnd) * DISK_THICKNESS * puff;
    pos[verse * 3 + 2] = sin * radial + cos * tangent;
  }
  return pos;
}

function createLines(scene: THREE.Scene, capacity: number, opacity: number) {
  const position = new THREE.BufferAttribute(new Float32Array(capacity * 6), 3);
  const color = new THREE.BufferAttribute(new Float32Array(capacity * 6), 3);
  position.setUsage(THREE.DynamicDrawUsage);
  color.setUsage(THREE.DynamicDrawUsage);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', position);
  geometry.setAttribute('color', color);
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  scene.add(lines);

  return {
    lines,
    material,
    setCount(count: number) {
      geometry.setDrawRange(0, count * 2);
      position.needsUpdate = true;
      color.needsUpdate = true;
    },
    write(pos: Float32Array, i: number, a: number, b: number, colorA: THREE.Color, colorB: THREE.Color) {
      for (let axis = 0; axis < 3; axis++) {
        position.array[i * 6 + axis] = pos[a * 3 + axis];
        position.array[i * 6 + 3 + axis] = pos[b * 3 + axis];
      }
      colorA.toArray(color.array, i * 6);
      colorB.toArray(color.array, i * 6 + 3);
    },
  };
}

export function createGalaxy(
  container: HTMLElement,
  store: LinkStore,
  callbacks: GalaxyCallbacks,
): GalaxyHandle {
  const pos = layoutStars();
  const genreOf = (verse: number) => BOOK_GENRE[VERSE_BOOK[verse]];

  const center = new THREE.Vector3();
  const bookStars = new Float64Array(TOTAL_BOOKS);
  const bookCenters = BOOKS.map(() => new THREE.Vector3());
  for (let verse = 0; verse < TOTAL_VERSES; verse++) {
    const book = VERSE_BOOK[verse];
    bookStars[book]++;
    bookCenters[book].x += pos[verse * 3];
    bookCenters[book].y += pos[verse * 3 + 1];
    bookCenters[book].z += pos[verse * 3 + 2];
  }
  bookCenters.forEach((c, book) => {
    center.add(c);
    c.divideScalar(bookStars[book]);
    c.y += 14;
  });
  center.divideScalar(TOTAL_VERSES);

  let radius = 1;
  for (let verse = 0; verse < TOTAL_VERSES; verse++) {
    radius = Math.max(radius, Math.hypot(
      pos[verse * 3] - center.x, pos[verse * 3 + 1] - center.y, pos[verse * 3 + 2] - center.z));
  }
  const halfFov = THREE.MathUtils.degToRad(FOV / 2);
  const wideFitDistance = (radius / Math.sin(halfFov)) * 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 4000);

  // The tilted disk is wider than it is tall, so portrait screens are limited by width.
  const fitDistance = () => radius * Math.max(
    FIT_WIDTH / (Math.tan(halfFov) * camera.aspect),
    FIT_HEIGHT / Math.tan(halfFov),
  );
  const restDirection = new THREE.Vector3(0, 0.62, 0.78).normalize();

  // Perspective draws the near rim lower than the far rim rises, so the resting view lifts to balance them.
  const restLift = () => {
    const rim = radius * VISUAL_RADIUS;
    const distance = fitDistance();
    const tangent = Math.tan(halfFov);
    const near = (restDirection.y * rim) / ((distance - restDirection.z * rim) * tangent);
    const far = (restDirection.y * rim) / ((distance + restDirection.z * rim) * tangent);
    return height * (near - far) / 4;
  };

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.setClearColor(getComputedStyle(document.body).backgroundColor, 1);
  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Every verse of the Bible as a star in a two-armed spiral');
  container.appendChild(canvas);

  const labelLayer = document.createElement('div');
  labelLayer.className = 'galaxy-labels';
  container.appendChild(labelLayer);

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionPreference.matches;

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
  controls.minDistance = 20;
  controls.maxDistance = 2200;
  controls.screenSpacePanning = true;
  controls.panSpeed = 0.9;
  controls.zoomSpeed = 0.9;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  // Stars
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const colorAttr = new THREE.BufferAttribute(new Float32Array(TOTAL_VERSES * 3), 3);
  const sizeAttr = new THREE.BufferAttribute(new Float32Array(TOTAL_VERSES).fill(BASE_SIZE), 1);
  const alphaAttr = new THREE.BufferAttribute(new Float32Array(TOTAL_VERSES).fill(REST_ALPHA), 1);
  geometry.setAttribute('aColor', colorAttr);
  geometry.setAttribute('size', sizeAttr);
  geometry.setAttribute('aAlpha', alphaAttr);
  const uniformK = 2 * wideFitDistance;
  const stars = new THREE.Points(geometry, new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPixelRatio: { value: renderer.getPixelRatio() },
      uK: { value: uniformK },
    },
  }));
  stars.frustumCulled = false;
  scene.add(stars);

  const strongest = createLines(scene, EDGE_CAP, EDGE_OPACITY);
  const fan = createLines(scene, FOCUS_EDGE_CAP, 0.5);
  const pointed = createLines(scene, 1, 1);

  // Labels, drawn over the canvas only where they fit
  const labels = BOOKS.map((book, index) => {
    const element = document.createElement('div');
    element.className = 'galaxy-label';
    element.textContent = book.name;
    element.hidden = true;
    labelLayer.appendChild(element);
    return { index, element, width: book.name.length * 7 + 16 };
  });
  let labelOrder = labels;
  const selectedBooks = new Set<number>();

  // State
  let options: GalaxyOptions = { links: true, bridgesOnly: false, labels: true, color: 'genre', size: 'uniform' };
  let visible: Int32Array = new Int32Array(0);
  let genre: number | null = null;
  let focus: GalaxyFocus | null = null;
  let drawn = 0;
  let width = 0;
  let height = 0;
  let shift = 0;
  let insetTarget = 0;
  let hovered = -1;
  // Spin belongs to the untouched view: once the reader moves the camera it stays where they left it.
  let leftRest = false;
  let needsRender = true;

  const degree = new Float32Array(TOTAL_VERSES);
  const starScale = new Float32Array(TOTAL_VERSES);
  const lit = new Uint8Array(TOTAL_VERSES);
  // 0 background, 1 linked from the focus, 2 inside it
  const focusRole = new Uint8Array(TOTAL_VERSES);

  function applyColors() {
    let maxDegree = 1;
    for (let i = 0; i < TOTAL_VERSES; i++) maxDegree = Math.max(maxDegree, degree[i]);
    const logMax = Math.log(maxDegree + 1);
    const color = new THREE.Color();
    for (let i = 0; i < TOTAL_VERSES; i++) {
      if (options.color === 'heat') heatColor(Math.log(degree[i] + 1) / logMax, color);
      else if (options.color === 'testament') color.copy(i < OT_VERSES ? TESTAMENT_OT : TESTAMENT_NT);
      else if (options.color === 'book') color.copy(BOOK_COLORS[VERSE_BOOK[i]]);
      else color.copy(GENRE_COLORS[genreOf(i)]);
      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }
    colorAttr.needsUpdate = true;
  }

  // A verse or two stands out in white; a whole book keeps its own color.
  const focusIsSmall = () => {
    let count = 0;
    if (focus) for (const [start, end] of focus.ranges) count += end - start + 1;
    return count > 0 && count <= FOCUS_SMALL_VERSES;
  };

  function applySizes() {
    const boost = focusIsSmall() ? FOCUS_SIZE : 1;
    for (let i = 0; i < TOTAL_VERSES; i++) {
      const size = options.size === 'uniform' ? BASE_SIZE : BASE_SIZE * starScale[i];
      sizeAttr.setX(i, focusRole[i] === 2 ? size * boost : size);
    }
    sizeAttr.needsUpdate = true;
  }

  function applyAlpha() {
    for (let i = 0; i < TOTAL_VERSES; i++) {
      const alpha = focus
        ? [DIM_ALPHA, REST_ALPHA, 1][focusRole[i]]
        : lit[i] ? REST_ALPHA : DIM_ALPHA;
      alphaAttr.setX(i, alpha);
    }
    alphaAttr.needsUpdate = true;
  }

  function drawStrongest() {
    let count = 0;
    if (options.links) {
      for (const id of visible) {
        if (count === EDGE_CAP) break;
        const a = linkFrom(store, id);
        const b = linkToStart(store, id);
        if (options.bridgesOnly && (a < OT_VERSES) === (b < OT_VERSES)) continue;
        strongest.write(pos, count++, a, b, GENRE_COLORS[genreOf(a)], GENRE_COLORS[genreOf(b)]);
      }
    }
    drawn = count;
    strongest.setCount(count);
    strongest.lines.visible = focus === null;
  }

  function drawFan() {
    const count = focus ? Math.min(focus.links.length, FOCUS_EDGE_CAP) : 0;
    const small = focusIsSmall();
    for (let i = 0; i < count; i++) {
      const id = focus!.links[i];
      const a = linkFrom(store, id);
      const b = linkToStart(store, id);
      fan.write(pos, i, a, b,
        small && focusRole[a] === 2 ? WHITE : GENRE_COLORS[genreOf(a)],
        small && focusRole[b] === 2 ? WHITE : GENRE_COLORS[genreOf(b)]);
    }
    fan.setCount(count);
    fan.material.opacity = THREE.MathUtils.clamp(FOCUS_EDGE_LIGHT / count, 0.14, 0.8);
  }

  // Selected books first, then the books they reach, then the largest books.
  function rankLabels() {
    const score = Float64Array.from(bookStars);
    if (genre !== null) score.forEach((_, book) => { if (BOOK_GENRE[book] === genre) score[book] += 1e6; });
    selectedBooks.clear();
    if (focus) {
      for (const [start, end] of focus.ranges) {
        selectedBooks.add(VERSE_BOOK[start]);
        selectedBooks.add(VERSE_BOOK[end]);
      }
      for (const id of focus.links) {
        score[VERSE_BOOK[linkFrom(store, id)]] += 1e4;
        score[VERSE_BOOK[linkToStart(store, id)]] += 1e4;
      }
      selectedBooks.forEach(book => { score[book] = Infinity; });
    }
    labelOrder = [...labels].sort((a, b) => score[b.index] - score[a.index]);
    labels.forEach(label => label.element.classList.toggle('selected', selectedBooks.has(label.index)));
  }

  function setLinks(ids: Int32Array, nextGenre: number | null) {
    visible = ids;
    genre = nextGenre;
    degree.fill(0);
    for (const id of ids) {
      degree[linkFrom(store, id)]++;
      const end = linkToEnd(store, id);
      for (let v = linkToStart(store, id); v <= end; v++) degree[v]++;
    }

    const p95 = Float32Array.from(degree).sort()[Math.floor(TOTAL_VERSES * 0.95)] || 1;
    for (let i = 0; i < TOTAL_VERSES; i++) {
      starScale[i] = 0.55 + 2.05 * Math.sqrt(Math.min(1, degree[i] / p95));
      lit[i] = degree[i] > 0 && (genre === null || genreOf(i) === genre) ? 1 : 0;
    }

    applyColors();
    applySizes();
    applyAlpha();
    drawStrongest();
    rankLabels();
    needsRender = true;
  }

  function setFocus(next: GalaxyFocus | null) {
    focus = next;
    focusRole.fill(0);
    if (next) {
      for (const id of next.links) {
        focusRole[linkFrom(store, id)] = 1;
        const end = linkToEnd(store, id);
        for (let v = linkToStart(store, id); v <= end; v++) focusRole[v] = 1;
      }
      for (const [start, end] of next.ranges) focusRole.fill(2, start, end + 1);
    }
    applySizes();
    applyAlpha();
    drawFan();
    strongest.lines.visible = next === null;
    rankLabels();
    needsRender = true;
  }

  function setHighlight(link: number | null) {
    if (link === null) {
      pointed.setCount(0);
    } else {
      pointed.write(pos, 0, linkFrom(store, link), linkToStart(store, link), WHITE, WHITE);
      pointed.setCount(1);
    }
    needsRender = true;
  }

  // Camera
  let flight: {
    start: number; duration: number;
    fromPosition: THREE.Vector3; fromTarget: THREE.Vector3;
    toPosition: THREE.Vector3; toTarget: THREE.Vector3;
  } | null = null;

  function flyTo(toTarget: THREE.Vector3, toPosition: THREE.Vector3, duration: number, toRest: boolean) {
    leftRest = !toRest;
    if (reducedMotion) {
      flight = null;
      controls.target.copy(toTarget);
      camera.position.copy(toPosition);
      needsRender = true;
      return;
    }
    flight = {
      start: performance.now(), duration,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition, toTarget,
    };
  }

  // Frames the focus with everything it links to, so the whole neighborhood reads at once.
  function flyToFocus() {
    if (!focus) return;
    const box = new THREE.Box3();
    const star = new THREE.Vector3();
    for (let i = 0; i < TOTAL_VERSES; i++) {
      if (focusRole[i] !== 0) box.expandByPoint(star.fromArray(pos, i * 3));
    }
    const middle = box.getCenter(new THREE.Vector3());
    const spread = box.getSize(star).length() / 2;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const tangent = Math.tan(halfFov) * Math.min(w, h - insetTarget) / h;
    const distance = THREE.MathUtils.clamp(spread / Math.sin(Math.atan(tangent)), radius * 0.6, fitDistance());
    const direction = camera.position.clone().sub(controls.target).normalize();
    flyTo(middle, middle.clone().addScaledVector(direction, distance), FOCUS_MS, false);
  }

  function fit() {
    const position = center.clone().addScaledVector(restDirection, fitDistance());
    flyTo(center.clone(), position, FIT_MS, true);
  }

  function applyShift() {
    // Shifting the view keeps the focus centered in what the phone's sheet leaves showing.
    if (shift > 0.5) camera.setViewOffset(width, height, 0, shift, width, height);
    else camera.clearViewOffset();
  }

  function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    applyShift();
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (!leftRest) {
      camera.position.copy(controls.target).addScaledVector(restDirection, fitDistance());
    }
    needsRender = true;
  }

  // Picking in screen space, matching the size the shader draws each star at
  const viewProjection = new THREE.Matrix4();

  function pick(clientX: number, clientY: number, pad: number): number {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const m = viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).elements;
    let best = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < TOTAL_VERSES; i++) {
      if (!lit[i] && focusRole[i] === 0) continue;
      const wx = pos[i * 3];
      const wy = pos[i * 3 + 1];
      const wz = pos[i * 3 + 2];
      const w = m[3] * wx + m[7] * wy + m[11] * wz + m[15];
      if (w <= 0) continue;
      const sx = ((m[0] * wx + m[4] * wy + m[8] * wz + m[12]) / w + 1) * 0.5 * rect.width;
      const sy = (1 - (m[1] * wx + m[5] * wy + m[9] * wz + m[13]) / w) * 0.5 * rect.height;
      const distance = Math.hypot(sx - x, sy - y);
      if (distance < bestDistance && distance <= 0.5 * sizeAttr.getX(i) * (uniformK / w) + pad) {
        bestDistance = distance;
        best = i;
      }
    }
    return best;
  }

  let pendingHover: { x: number; y: number } | null = null;
  let down: { x: number; y: number; pad: number } | null = null;
  let dragged = false;

  function setHovered(verse: number, x: number, y: number) {
    hovered = verse;
    canvas.style.cursor = verse >= 0 ? 'pointer' : 'grab';
    callbacks.onHover(verse >= 0 ? verse : null, verse >= 0 ? degree[verse] : 0, x, y);
  }

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons !== 0) return;
    if (pendingHover === null) {
      requestAnimationFrame(() => {
        if (pendingHover) setHovered(pick(pendingHover.x, pendingHover.y, HIT_PAD_MOUSE), pendingHover.x, pendingHover.y);
        pendingHover = null;
      });
    }
    pendingHover = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointerleave', () => {
    pendingHover = null;
    if (hovered >= 0) setHovered(-1, 0, 0);
  });

  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, pad: e.pointerType === 'mouse' ? HIT_PAD_MOUSE : HIT_PAD_TOUCH };
    if (flight) {
      flight = null;
      leftRest = true;
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    dragged = down !== null && Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_SLOP_PX;
    if (dragged) leftRest = true;
  });

  canvas.addEventListener('wheel', () => {
    flight = null;
    leftRest = true;
  }, { passive: true });

  canvas.addEventListener('click', (e) => {
    if (dragged || !down) return;
    const verse = pick(e.clientX, e.clientY, down.pad);
    callbacks.onSelect(verse >= 0 ? verse : null);
  });

  const projected = new THREE.Vector3();

  function positionLabels() {
    const occupied: { x: number; y: number; width: number }[] = [];
    const zoom = wideFitDistance / camera.position.distanceTo(controls.target);
    const maxLabels = Math.min(30, Math.max(4, Math.round(10 * zoom * Math.min(1, width / 800))));
    const floor = height - insetTarget - 14;

    for (const label of labelOrder) {
      let placed = false;
      if (options.labels && occupied.length < maxLabels) {
        projected.copy(bookCenters[label.index]).project(camera);
        const onScreen = Math.abs(projected.x) <= 1 && Math.abs(projected.z) <= 1;
        const x = THREE.MathUtils.clamp((projected.x + 1) * width / 2, label.width / 2, width - label.width / 2);
        const y = (1 - projected.y) * height / 2;
        const offsets = selectedBooks.has(label.index) ? SELECTED_LABEL_OFFSETS : [0];
        const offset = onScreen ? offsets.find(dy => y + dy > 14 && y + dy < floor &&
          !occupied.some(other =>
            Math.abs(x - other.x) < (label.width + other.width) / 2 && Math.abs(y + dy - other.y) < 26)) : undefined;
        if (offset !== undefined) {
          label.element.style.transform = `translate(${x}px, ${y + offset}px) translate(-50%, -50%)`;
          occupied.push({ x, y: y + offset, width: label.width });
          placed = true;
        }
      }
      if (label.element.hidden === placed) label.element.hidden = !placed;
    }
  }

  // Render loop: runs only while the view shows, and draws only when something changed.
  let introStart = reducedMotion ? null : performance.now();
  let raf = 0;
  let active = false;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const now = performance.now();

    const shiftTarget = insetTarget / 2 + (focus ? 0 : restLift());
    if (shift !== shiftTarget) {
      const gap = shiftTarget - shift;
      shift = reducedMotion || Math.abs(gap) < 0.5 ? shiftTarget : shift + gap * SHIFT_EASE;
      applyShift();
      needsRender = true;
    }

    const trip = flight;
    const progress = trip ? easeInOutCubic(Math.min(1, (now - trip.start) / trip.duration)) : 0;
    if (trip) controls.target.lerpVectors(trip.fromTarget, trip.toTarget, progress);
    controls.autoRotate = !reducedMotion && !leftRest && !flight && focus === null && hovered < 0;
    if (controls.update()) needsRender = true;
    if (trip) {
      camera.position.lerpVectors(trip.fromPosition, trip.toPosition, progress);
      needsRender = true;
      if (progress >= 1) flight = null;
    }

    if (introStart !== null) {
      const elapsed = (now - introStart) / INTRO_MS;
      if (elapsed >= 1 || leftRest || focus) {
        introStart = null;
      } else {
        const rest = fitDistance();
        const eased = 1 - Math.pow(1 - elapsed, 3);
        const direction = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target).addScaledVector(direction, rest * (1.28 - 0.28 * eased));
        needsRender = true;
      }
    }

    if (!needsRender) return;
    needsRender = false;
    renderer.render(scene, camera);
    positionLabels();
  };

  const syncLoop = () => {
    const running = active && !document.hidden;
    if (running && !raf) {
      raf = requestAnimationFrame(frame);
    } else if (!running && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  motionPreference.addEventListener('change', () => {
    reducedMotion = motionPreference.matches;
    if (reducedMotion) introStart = null;
  });
  document.addEventListener('visibilitychange', syncLoop);

  return {
    setLinks,
    setFocus,
    setHighlight,
    setOptions(next) {
      const previous = options;
      options = next;
      if (next.color !== previous.color) applyColors();
      if (next.size !== previous.size) applySizes();
      if (next.links !== previous.links || next.bridgesOnly !== previous.bridgesOnly) drawStrongest();
      needsRender = true;
    },
    setInset(pixels) { insetTarget = pixels; },
    drawCount: () => focus
      ? { drawn: Math.min(focus.links.length, FOCUS_EDGE_CAP), total: focus.links.length }
      : { drawn, total: visible.length },
    flyToFocus,
    fit,
    resize,
    setActive(next) {
      active = next;
      if (next) resize();
      syncLoop();
    },
  };
}
