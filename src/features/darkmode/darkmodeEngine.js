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
    const newLuma = lut[Math.round(oldLuma)];
    const { h, s } = rgbToHueSat(r, g, b);

    let nr;
    let ng;
    let nb;
    if (s === 0) {
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
