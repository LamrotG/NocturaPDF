import { hexToRgb } from "../../utils/formatters.js";

function rgbLuma({ r, g, b }) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Builds a 256-entry lookup table mapping input luma (0=black..255=white)
// to output luma, so white paper lands on the theme's dark background and
// black text lands on the theme's light foreground. "aggressive" mode steepens
// the curve around the midpoint for stronger contrast on plain text pages.
export function buildLightnessLUT(theme) {
  const bgLuma = rgbLuma(hexToRgb(theme.bg));
  const fgLuma = rgbLuma(hexToRgb(theme.fg));
  const contrastBoost = theme.mode === "aggressive" ? 1.6 : 1;

  const lut = new Uint8ClampedArray(256);
  for (let L = 0; L <= 255; L += 1) {
    let t = L / 255;
    if (contrastBoost !== 1) {
      t = clamp01((t - 0.5) * contrastBoost + 0.5);
    }
    lut[L] = fgLuma + (bgLuma - fgLuma) * t;
  }
  return lut;
}

const lutCache = new Map();

// Memoized per theme id — only a handful of themes exist, so this never
// needs to run more than once per theme for the lifetime of the app.
export function getThemeLut(theme) {
  if (!theme || theme.id === "off") return null;
  if (!lutCache.has(theme.id)) {
    lutCache.set(theme.id, buildLightnessLUT(theme));
  }
  return lutCache.get(theme.id);
}

export function cloneImageData(imageData) {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

const WARM_BIAS = 18;

// Hue + saturation from sRGB, HSL-style (0..1 each). Returns null hue/sat0
// for achromatic pixels (max === min) — callers should special-case that
// rather than divide by zero.
function rgbToHueSat(r, g, b) {
  const max = r > g ? (r > b ? r : b) : g > b ? g : b;
  const min = r < g ? (r < b ? r : b) : g < b ? g : b;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0 };

  const l = (max + min) / 510; // /2/255
  const s = d / 255 / (l > 0.5 ? 2 - (max + min) / 255 : (max + min) / 255);

  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h, s };
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

// Remaps lightness while preserving hue/saturation. Near-gray pixels (most
// of a text page) get a direct luma swap. Chroma pixels (figures, charts,
// highlights) go through an HSL reconstruction — replace lightness, keep
// hue/saturation, convert back — rather than scaling r/g/b by newLuma/oldLuma.
// That older ratio-scale approach blew up for anti-aliased text-edge pixels
// (oldLuma near 0 on a black-text page gives a huge scale factor), and tiny
// per-channel rounding differences at those edges got amplified into visible
// per-channel clipping — a metallic/rainbow fringe around every glyph. HSL
// reconstruction is bounded (lightness is just set, never divided into), so
// it can't blow up the same way. Mutates and returns `imageData` — pass a
// clone if the source needs to stay untouched (e.g. a cached raw page).
export function applyTheme(imageData, lut, themeMode) {
  if (!lut) return imageData;

  const d = imageData.data;
  const warmBias = themeMode === "warm" ? WARM_BIAS : 0;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    const oldLuma = 0.299 * r + 0.587 * g + 0.114 * b;
    let newLuma = lut[Math.round(oldLuma)];
    if (themeMode === "scan") {
      // For scanned pages, prefer a grayscale tone-mapping that preserves
      // contrast in midtones while reducing paper brightness. Apply a
      // gentle nonlinear tone curve that compresses highlights slightly.
      const t = newLuma / 255;
      const adjusted = 255 * Math.pow(t, 0.92); // slight gamma for tone mapping
      newLuma = Math.round(adjusted * (0.86 + 0.14 * (oldLuma / 255)));
    }
    const { h, s } = rgbToHueSat(r, g, b);

    let nr;
    let ng;
    let nb;
    if (themeMode === "overlay" || themeMode === "preserve") {
      // Preserve: gentle overlay that reduces brightness but keeps color.
      // Blend original channels with the mapped luminance to reduce
      // brightness while retaining chroma information.
      nr = r * 0.62 + newLuma * 0.38;
      ng = g * 0.62 + newLuma * 0.38;
      nb = b * 0.62 + newLuma * 0.38;
    } else if (themeMode === "scan") {
      // Grayscale tone mapping for scanned pages
      nr = ng = nb = newLuma;
    } else if (s === 0) {
      nr = ng = nb = newLuma;
    } else {
      const l = newLuma / 255;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      nr = hue2rgb(p, q, h + 1 / 3) * 255;
      ng = hue2rgb(p, q, h) * 255;
      nb = hue2rgb(p, q, h - 1 / 3) * 255;
    }

    if (warmBias) {
      nr += warmBias;
      nb -= warmBias;
    }

    d[i] = nr;
    d[i + 1] = ng;
    d[i + 2] = nb;
  }

  return imageData;
}

// GPU themes sample PDF.js' canvas directly, so there is no Canvas2D pixel
// readback on the main thread. The LUT remains a compact 256px GPU texture.
export function drawWebglTheme(canvas, source, lut, options = {}) {
  // Render to an internal offscreen canvas, then blit the result onto the
  // visible `canvas` with a 2D context. A canvas can only ever have ONE
  // context type: once getContext("webgl") is called on it, getContext("2d")
  // returns null forever — which would break every CPU fallback (drawImage /
  // putImageData) if WebGL ever fails. Keeping the WebGL context off the
  // visible canvas means the 2D fallback always works.
  const glCanvas = document.createElement("canvas");
  glCanvas.width = canvas.width;
  glCanvas.height = canvas.height;
  const gl = glCanvas.getContext("webgl", { alpha: false, premultipliedAlpha: false }) || glCanvas.getContext("experimental-webgl", { alpha: false });
  if (!gl) return false;
  const makeShader = (type, code) => { const shader = gl.createShader(type); gl.shaderSource(shader, code); gl.compileShader(shader); return shader; };
  const vertexSrc = "attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.0)*.5;gl_Position=vec4(p,0.,1.);}";

  // Two fragment shaders: a general-purpose LUT mapper and a Pure Black
  // variant that emphasises deep blacks and high-contrast text while
  // attempting to preserve chroma for images.
  const fragmentGeneral = "precision mediump float;varying vec2 uv;uniform sampler2D page,table;void main(){vec4 c=texture2D(page,vec2(uv.x,1.0-uv.y));float y=dot(c.rgb,vec3(.299,.587,.114));float n=texture2D(table,vec2(y,.5)).r;float k=y>.003?n/y:1.;gl_FragColor=vec4(min(c.rgb*k,1.),1.);}";
  const fragmentPureBlack = `precision mediump float;
varying vec2 uv;
uniform sampler2D page,table;
void main(){
  vec4 c = texture2D(page, vec2(uv.x, 1.0 - uv.y));
  float y = dot(c.rgb, vec3(.299, .587, .114));
  float mapped = texture2D(table, vec2(y, .5)).r;
  float scale = y > 0.003 ? mapped / y : 1.0;
  vec3 scaled = min(c.rgb * scale, vec3(1.0));
  vec3 lumOnly = vec3(mapped);
  float preserve = clamp((1.0 - y) * 1.2, 0.0, 1.0);
  vec3 outc = mix(scaled, lumOnly, 1.0 - preserve);
  outc = pow(outc, vec3(1.02));
  gl_FragColor = vec4(outc, 1.0);
}`;
  const fragmentGpuDark = `precision mediump float;
varying vec2 uv;
uniform sampler2D page,table;
void main(){
  vec4 c = texture2D(page, vec2(uv.x, 1.0 - uv.y));
  float y = dot(c.rgb, vec3(.299, .587, .114));
  float mapped = texture2D(table, vec2(y, .5)).r;
  float chroma = length(c.rgb - vec3(y));
  float chromaFactor = clamp(chroma * 1.5, 0.0, 1.0);
  float scale = y > 0.003 ? mapped / y : 1.0;
  vec3 scaled = min(c.rgb * scale, vec3(1.0));
  vec3 mappedRgb = vec3(mapped);
  vec3 outc = mix(mappedRgb, scaled, chromaFactor);
  outc = pow(outc, vec3(1.01));
  gl_FragColor = vec4(outc, 1.0);
}`;

  let fragment = fragmentGeneral;
  if (options.shader === "pureBlack") fragment = fragmentPureBlack;
  else if (options.shader === "gpuDark") fragment = fragmentGpuDark;

  const vertex = makeShader(gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = makeShader(gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragmentShader); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
  gl.viewport(0, 0, glCanvas.width, glCanvas.height); gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const point = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
  const addTexture = (unit, input) => { const texture = gl.createTexture(); gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D, texture); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input); };
  addTexture(gl.TEXTURE0, source); gl.uniform1i(gl.getUniformLocation(program, "page"), 0);
  // ImageData requires a Uint8ClampedArray — a plain Uint8Array throws
  // "Failed to construct 'ImageData': The provided value is not of type
  // 'ImageDataSettings'".
  const lutPixels = new Uint8ClampedArray(256 * 4); for (let i = 0; i < 256; i += 1) lutPixels.set([lut[i], lut[i], lut[i], 255], i * 4);
  addTexture(gl.TEXTURE1, new ImageData(lutPixels, 256, 1)); gl.uniform1i(gl.getUniformLocation(program, "table"), 1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Blit the GPU result onto the visible canvas with a 2D context.
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return false;
  ctx.drawImage(glCanvas, 0, 0);
  return true;
}
