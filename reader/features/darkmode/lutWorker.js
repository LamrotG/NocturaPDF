self.onmessage = ({ data }) => {
  const { id, pixels, lut, mode } = data;
  const d = new Uint8ClampedArray(pixels);
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    let next = lut[luma];
    if (mode === "scan") {
      // Grayscale tone-mapping for scanned pages — apply a slight gamma
      // compression and scale similar to main-thread implementation.
      const t = next / 255;
      const adjusted = 255 * Math.pow(t, 0.92);
      next = Math.round(adjusted * (0.86 + 0.14 * (luma / 255)));
      d[i] = d[i + 1] = d[i + 2] = next;
      continue;
    }
    if (mode === "balanced") {
      // Balanced (Smart / Native): same combined gate as the main thread —
      // colour survives only when the pixel is chromatic in both an absolute
      // and a relative sense, so fringe pixels collapse to the exact LUT grey
      // (Scan Dark's principle) while real colour keeps its hue through the
      // gentle preserve blend (GPU Dark's principle).
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const absT = Math.min(Math.max((mx - mn - 9) / (31 - 9), 0), 1);
      const absF = absT * absT * (3 - 2 * absT);
      const rel = (mx - mn) / Math.max(mx, 1);
      const relT = Math.min(Math.max((rel - 0.18) / (0.45 - 0.18), 0), 1);
      const chromaMix = absF * relT * relT * (3 - 2 * relT);
      const pr = r * 0.62 + next * 0.38;
      const pg = g * 0.62 + next * 0.38;
      const pb = b * 0.62 + next * 0.38;
      d[i] = Math.round(next + (pr - next) * chromaMix);
      d[i + 1] = Math.round(next + (pg - next) * chromaMix);
      d[i + 2] = Math.round(next + (pb - next) * chromaMix);
      continue;
    }
    if (mode === "overlay" || mode === "preserve") {
      d[i] = Math.round(r * 0.62 + next * 0.38);
      d[i + 1] = Math.round(g * 0.62 + next * 0.38);
      d[i + 2] = Math.round(b * 0.62 + next * 0.38);
      continue;
    }
    // Default: preserve hue/saturation via HSL reconstruction scaled by LUT
    const scale = luma ? next / luma : 1;
    let nr = Math.min(255, Math.round(r * scale));
    let ng = Math.min(255, Math.round(g * scale));
    let nb = Math.min(255, Math.round(b * scale));
    if (mode === "aggressive") {
      // Same combined gate as the main thread and the WebGL shader: colour
      // survives only when the pixel is chromatic in both an absolute and a
      // relative sense, so every fringe/anti-aliasing tint lands on the exact
      // LUT grey (no per-channel scaling — that used to punch black holes
      // inside glyph strokes), while real colour keeps its hue. Without this
      // the worker path and the main-thread path would disagree.
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const absT = Math.min(Math.max((mx - mn - 9) / (31 - 9), 0), 1);
      const absF = absT * absT * (3 - 2 * absT);
      const rel = (mx - mn) / Math.max(mx, 1);
      const relT = Math.min(Math.max((rel - 0.12) / (0.3 - 0.12), 0), 1);
      const chromaMix = absF * relT * relT * (3 - 2 * relT);
      const scale = Math.min(Math.max(next / Math.max(luma, 5), 0), 3);
      const keep = Math.min(Math.max((1 - luma / 255) * 1.2, 0), 1);
      const cr = next + (Math.min(255, r * scale) - next) * keep;
      const cg = next + (Math.min(255, g * scale) - next) * keep;
      const cb = next + (Math.min(255, b * scale) - next) * keep;
      nr = next + (cr - next) * chromaMix;
      ng = next + (cg - next) * chromaMix;
      nb = next + (cb - next) * chromaMix;
    }
    d[i] = nr;
    d[i + 1] = ng;
    d[i + 2] = nb;
  }
  self.postMessage({ id, pixels: d.buffer }, [d.buffer]);
};
