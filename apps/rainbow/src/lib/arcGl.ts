import { cssToken } from '@jessespencer/bible-ui/tokens';
import { GENRES, BOOK_GENRE } from '../data/genres';
import { linkFrom, linkToStart, linkVotes, type LinkStore } from './links';
import { WORLD_WIDTH, xOfVerse } from './layout';
import { VERSE_BOOK } from './verses';

export interface ArcView {
  k: number;
  tx: number;
  ty: number;
  width: number;
  height: number;
  dpr: number;
  reveal: number;
  backgroundAlpha: number;
}

export interface ArcRenderer {
  setArcs(store: LinkStore, ids: Int32Array): void;
  setFocus(store: LinkStore, ids: Int32Array | null): void;
  draw(view: ArcView): void;
  resize(width: number, height: number, dpr: number): void;
}

interface ArcBatch {
  buffer: WebGLBuffer;
  vao: WebGLVertexArrayObject;
  count: number;
  segments: number;
}

const FLOATS_PER_ARC = 5;

export const MAX_DPR = 2;

const ARC_COVERAGE = 8;
const MIN_ALPHA = 0.015;
const MAX_ALPHA = 0.7;

// World-span buckets: small arcs need few segments, which keeps a whole-Bible draw light on phones.
const BUCKETS = [
  { maxSpan: 4, segments: 6 },
  { maxSpan: 60, segments: 16 },
  { maxSpan: 300, segments: 32 },
  { maxSpan: Infinity, segments: 64 },
];

const VERTEX_SHADER = `#version 300 es
precision highp float;
const float WORLD_WIDTH = ${WORLD_WIDTH.toFixed(1)};
const float WAVE_SPREAD = 1.4;
in vec2 a_ends;
in vec2 a_genres;
in float a_weight;
uniform vec2 u_size;
uniform vec3 u_view;
uniform float u_segments;
uniform float u_reveal;
uniform vec3 u_palette[8];
out vec4 v_color;
void main() {
  float t = float(gl_VertexID) / u_segments;
  // Intro: each arc traces itself from its left foot, starting as the wave reaches it.
  float local = clamp(u_reveal * (1.0 + WAVE_SPREAD) - WAVE_SPREAD * a_ends.x / WORLD_WIDTH, 0.0, 1.0);
  local = local * local * (3.0 - 2.0 * local);
  float angle = 3.14159265 * (1.0 - t * local);
  float mid = (a_ends.x + a_ends.y) * 0.5;
  float radius = (a_ends.y - a_ends.x) * 0.5;
  vec2 world = vec2(mid + radius * cos(angle), -radius * sin(angle));
  vec2 screen = world * u_view.x + u_view.yz;
  gl_Position = vec4(screen.x / u_size.x * 2.0 - 1.0, 1.0 - screen.y / u_size.y * 2.0, 0.0, 1.0);
  vec3 color = mix(u_palette[int(a_genres.x)], u_palette[int(a_genres.y)], t);
  v_color = vec4(color, local > 0.0 ? a_weight : 0.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec4 v_color;
uniform float u_alpha;
out vec4 color;
void main() {
  color = vec4(v_color.rgb, v_color.a * u_alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader failed to compile');
  }
  return shader;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function arcWeight(votes: number): number {
  return 0.35 + 0.65 * Math.min(1, Math.log(Math.max(votes, 0) + 1) / Math.log(200));
}

// The fewer the arcs and the more pixels they cover, the more opaque each can be. Square root,
// because a filtered set still piles up in one region and a linear rule would burn it to white.
function arcAlpha(count: number, view: ArcView): number {
  const scale = Math.min(3, Math.max(0.25, view.k / 1.2)) * (view.dpr / MAX_DPR);
  return Math.min(MAX_ALPHA, Math.max(MIN_ALPHA, (ARC_COVERAGE * scale) / Math.sqrt(Math.max(count, 1))));
}

function writeArc(out: Float32Array, at: number, store: LinkStore, id: number) {
  const from = linkFrom(store, id);
  const to = linkToStart(store, id);
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  out[at] = xOfVerse(low);
  out[at + 1] = xOfVerse(high);
  out[at + 2] = BOOK_GENRE[VERSE_BOOK[low]];
  out[at + 3] = BOOK_GENRE[VERSE_BOOK[high]];
  out[at + 4] = arcWeight(linkVotes(store, id));
}

export function createArcRenderer(canvas: HTMLCanvasElement): ArcRenderer | null {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'Program failed to link');
  }
  gl.useProgram(program);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uniforms = {
    size: uniform('u_size'),
    view: uniform('u_view'),
    segments: uniform('u_segments'),
    reveal: uniform('u_reveal'),
    alpha: uniform('u_alpha'),
  };
  gl.uniform3fv(uniform('u_palette'), GENRES.flatMap(g => hexToRgb(g.color)));

  const attributes = {
    ends: gl.getAttribLocation(program, 'a_ends'),
    genres: gl.getAttribLocation(program, 'a_genres'),
    weight: gl.getAttribLocation(program, 'a_weight'),
  };

  gl.enable(gl.BLEND);
  // Additive, so overlapping arcs build into light and the picture keeps its depth.
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  const base = Number.parseInt(cssToken('--bg-base').slice(1), 16);
  gl.clearColor((base >> 16 & 255) / 255, (base >> 8 & 255) / 255, (base & 255) / 255, 1);

  function createBatch(segments: number): ArcBatch {
    const vao = gl!.createVertexArray()!;
    const buffer = gl!.createBuffer()!;
    gl!.bindVertexArray(vao);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
    const stride = FLOATS_PER_ARC * 4;
    const bind = (location: number, size: number, offset: number) => {
      gl!.enableVertexAttribArray(location);
      gl!.vertexAttribPointer(location, size, gl!.FLOAT, false, stride, offset);
      gl!.vertexAttribDivisor(location, 1);
    };
    bind(attributes.ends, 2, 0);
    bind(attributes.genres, 2, 8);
    bind(attributes.weight, 1, 16);
    gl!.bindVertexArray(null);
    return { buffer, vao, count: 0, segments };
  }

  function upload(batch: ArcBatch, data: Float32Array, count: number) {
    gl!.bindBuffer(gl!.ARRAY_BUFFER, batch.buffer);
    gl!.bufferData(gl!.ARRAY_BUFFER, data.subarray(0, count * FLOATS_PER_ARC), gl!.STATIC_DRAW);
    batch.count = count;
  }

  const background = BUCKETS.map(bucket => createBatch(bucket.segments));
  const focus = createBatch(64);
  let backgroundCount = 0;

  function drawBatch(batch: ArcBatch, k: number) {
    if (batch.count === 0) return;
    // Zoomed in, arcs need finer steps to stay round, but only the bottoms of long ones are in view.
    const segments = batch.segments * (k > 4 ? 2 : 1);
    gl!.uniform1f(uniforms.segments, segments);
    gl!.bindVertexArray(batch.vao);
    gl!.drawArraysInstanced(gl!.LINE_STRIP, 0, segments + 1, batch.count);
  }

  return {
    setArcs(store, ids) {
      backgroundCount = ids.length;
      const scratch = BUCKETS.map(() => new Float32Array(ids.length * FLOATS_PER_ARC));
      const counts = BUCKETS.map(() => 0);
      for (const id of ids) {
        const span = Math.abs(xOfVerse(linkFrom(store, id)) - xOfVerse(linkToStart(store, id)));
        const b = BUCKETS.findIndex(bucket => span <= bucket.maxSpan);
        writeArc(scratch[b], counts[b] * FLOATS_PER_ARC, store, id);
        counts[b]++;
      }
      background.forEach((batch, b) => upload(batch, scratch[b], counts[b]));
    },

    setFocus(store, ids) {
      const data = new Float32Array((ids?.length ?? 0) * FLOATS_PER_ARC);
      ids?.forEach((id, i) => writeArc(data, i * FLOATS_PER_ARC, store, id));
      upload(focus, data, ids?.length ?? 0);
    },

    resize(width, height, dpr) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    },

    draw(view) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uniforms.size, view.width, view.height);
      gl.uniform3f(uniforms.view, view.k, view.tx, view.ty);
      gl.uniform1f(uniforms.reveal, view.reveal);

      // Long arcs go down first, so the short ones stay legible on top.
      gl.uniform1f(uniforms.alpha, arcAlpha(backgroundCount, view) * view.backgroundAlpha);
      for (let b = background.length - 1; b >= 0; b--) drawBatch(background[b], view.k);

      // The same rule as the full view, so color doesn't jump when a selection narrows the arcs.
      gl.uniform1f(uniforms.alpha, arcAlpha(focus.count, view));
      drawBatch(focus, view.k);
      gl.bindVertexArray(null);
    },
  };
}
