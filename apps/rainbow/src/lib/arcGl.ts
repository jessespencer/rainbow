import { cssToken } from '@jessespencer/bible-ui/tokens';
import { currentTheme } from '@jessespencer/bible-ui/theme';
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
  /** Read the theme again: light on Night's sky, or ink on Day's paper. Draw after. */
  setTheme(light: boolean): void;
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
// How bright the summed light is before the curve maps it. A little over 1, so the overview keeps
// its sparkle now that dense areas no longer clip.
const EXPOSURE = 1.35;
// The same for Day's ink: how dark the summed ink is before it meets the paper.
const INK_EXPOSURE = 0.75;
// The darkest any one channel of an ink counts as, so no colour absorbs without limit.
const INK_FLOOR = '0.14';
// How much brighter a selection's arcs draw than the same arcs in the overview.
const FOCUS_LIFT = 1.4;
// By day a selection has no glow to stand out by, so its ink lays down this much heavier.
const FOCUS_INK = 2.4;

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
uniform float u_ink;
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
  // By day an arc carries how much of each channel its ink takes from the paper. Mixed before
  // converting, and floored, so an arc between two sections stays a blend rather than going black.
  if (u_ink > 0.5) color = -log(max(color, vec3(${INK_FLOOR})));
  v_color = vec4(color, local > 0.0 ? a_weight : 0.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec4 v_color;
uniform float u_alpha;
uniform float u_premultiply;
uniform float u_strength;
out vec4 color;
void main() {
  float a = v_color.a * u_alpha;
  color = vec4(v_color.rgb * u_strength * mix(1.0, a, u_premultiply), a);
}`;

// Second pass: arcs add up in a float buffer, then this maps the total to the screen. Faint arcs pass
// through as they were; dense ones roll off along a soft curve that keeps their colour, instead of every
// channel clipping to white. Only the very densest cores fade toward white.
const COMPOSITE_VERTEX = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0;
  v_uv = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

// By day the same buffer holds ink instead of light: each arc adds its section's absorbance, and
// the paper shows through by Beer–Lambert, so faint arcs tint it and dense ones deepen toward a dark
// ink of their own hue. Opaque, since the paper is drawn here.
const COMPOSITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_light;
uniform float u_exposure;
uniform float u_ink;
uniform vec3 u_paper;
out vec4 color;
void main() {
  if (u_ink > 0.5) {
    vec3 density = texture(u_light, v_uv).rgb * u_exposure;
    color = vec4(u_paper * exp(-density), 1.0);
    return;
  }
  vec3 light = texture(u_light, v_uv).rgb * u_exposure;
  float luma = dot(light, vec3(0.2126, 0.7152, 0.0722));
  vec3 mapped = luma > 0.0 ? light * (1.0 - exp(-luma)) / luma : light;
  mapped /= max(1.0, max(mapped.r, max(mapped.g, mapped.b)));
  mapped = mix(mapped, vec3(1.0), smoothstep(1.5, 9.0, luma) * 0.6);
  // Premultiplied and transparent where there's no light, so the sky (sky.ts) shows through
  // empty space and fades behind the arcs as they brighten.
  mapped = min(mapped, vec3(1.0));
  color = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
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

function link(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'Program failed to link');
  }
  return program;
}

interface LightBuffer {
  resize(width: number, height: number): void;
  /** Light on Night's sky, or ink on Day's paper. */
  setInk(paper: [number, number, number] | null): void;
  begin(): void;
  finish(exposure: number): void;
}

// A multisampled half-float target the arcs add into, resolved to a texture and composited.
// Returns null where float targets aren't renderable, and the arcs draw straight to the screen.
function createLightBuffer(gl: WebGL2RenderingContext): LightBuffer | null {
  if (!gl.getExtension('EXT_color_buffer_float')) return null;
  const program = link(gl, COMPOSITE_VERTEX, COMPOSITE_FRAGMENT);
  const exposure = gl.getUniformLocation(program, 'u_exposure');
  const ink = gl.getUniformLocation(program, 'u_ink');
  const paperUniform = gl.getUniformLocation(program, 'u_paper');
  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'u_light'), 0);

  const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) as number);
  const color = gl.createRenderbuffer()!;
  const drawTarget = gl.createFramebuffer()!;
  const texture = gl.createTexture()!;
  const resolveTarget = gl.createFramebuffer()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  let width = 1;
  let height = 1;

  return {
    resize(w, h) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      gl.bindRenderbuffer(gl.RENDERBUFFER, color);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA16F, width, height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, drawTarget);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, resolveTarget);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    setInk(paper) {
      gl.useProgram(program);
      gl.uniform1f(ink, paper ? 1 : 0);
      if (paper) gl.uniform3f(paperUniform, ...paper);
    },
    begin() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, drawTarget);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    finish(level) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, drawTarget);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resolveTarget);
      gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.BLEND);
      gl.useProgram(program);
      gl.uniform1f(exposure, level);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.BLEND);
    },
  };
}

export function createArcRenderer(canvas: HTMLCanvasElement): ArcRenderer | null {
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) return null;

  const program = link(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  gl.useProgram(program);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uniforms = {
    size: uniform('u_size'),
    view: uniform('u_view'),
    segments: uniform('u_segments'),
    reveal: uniform('u_reveal'),
    alpha: uniform('u_alpha'),
    strength: uniform('u_strength'),
  };
  const premultiply = uniform('u_premultiply');

  const attributes = {
    ends: gl.getAttribLocation(program, 'a_ends'),
    genres: gl.getAttribLocation(program, 'a_genres'),
    weight: gl.getAttribLocation(program, 'a_weight'),
  };

  gl.enable(gl.BLEND);
  const light = createLightBuffer(gl);
  let base: [number, number, number] = [0, 0, 0];
  let ink = false;

  function setTheme(next: boolean) {
    ink = next;
    base = hexToRgb(cssToken('--bg-base'));
    gl!.useProgram(program);
    // Night's arcs carry their colour as light; Day's carry their ink, turned to absorbance in the shader.
    gl!.uniform3fv(uniform('u_palette'), GENRES.flatMap(g => hexToRgb(ink ? g.ink : g.color)));
    gl!.uniform1f(uniform('u_ink'), ink ? 1 : 0);
    light?.setInk(ink ? base : null);
    // Additive, so overlapping arcs build into light, or into ink, and the picture keeps its depth.
    // Without the float buffer, Day's ink multiplies the paper down directly.
    gl!.uniform1f(premultiply, !light && ink ? 1 : 0);
    if (!light && ink) gl!.blendFunc(gl!.ZERO, gl!.ONE_MINUS_SRC_COLOR);
    else gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE);
  }
  setTheme(currentTheme() === 'light');

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
      light?.resize(canvas.width, canvas.height);
    },

    draw(view) {
      if (light) {
        light.begin();
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(...base, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.useProgram(program);
      gl.uniform2f(uniforms.size, view.width, view.height);
      gl.uniform3f(uniforms.view, view.k, view.tx, view.ty);
      gl.uniform1f(uniforms.reveal, view.reveal);

      // Long arcs go down first, so the short ones stay legible on top.
      gl.uniform1f(uniforms.alpha, arcAlpha(backgroundCount, view) * view.backgroundAlpha);
      gl.uniform1f(uniforms.strength, 1);
      for (let b = background.length - 1; b >= 0; b--) drawBatch(background[b], view.k);

      // The same rule as the full view, lifted a little: the calm overview stays calm, and what you pick glows.
      gl.uniform1f(uniforms.alpha, Math.min(MAX_ALPHA, arcAlpha(focus.count, view) * FOCUS_LIFT));
      gl.uniform1f(uniforms.strength, ink ? FOCUS_INK : 1);
      drawBatch(focus, view.k);
      gl.bindVertexArray(null);
      light?.finish(ink ? INK_EXPOSURE : EXPOSURE);
    },

    setTheme,
  };
}
