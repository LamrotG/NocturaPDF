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
    if (mode === "overlay" || mode === "preserve") {
      d[i] = Math.round(r * 0.62 + next * 0.38);
      d[i + 1] = Math.round(g * 0.62 + next * 0.38);
      d[i + 2] = Math.round(b * 0.62 + next * 0.38);
      continue;
    }
    // Default: preserve hue/saturation via HSL reconstruction scaled by LUT
    const scale = luma ? next / luma : 1;
    d[i] = Math.min(255, Math.round(r * scale));
    d[i + 1] = Math.min(255, Math.round(g * scale));
    d[i + 2] = Math.min(255, Math.round(b * scale));
  }
  self.postMessage({ id, pixels: d.buffer }, [d.buffer]);
};
