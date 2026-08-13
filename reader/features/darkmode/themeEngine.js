// Lightweight render-path selector based solely on the chosen color mode.
// No page analysis is performed — the color mode configuration determines
// the renderer, worker usage, and shader choice directly.

export function determineRenderDecision(colorMode) {
  if (!colorMode || colorMode.id === "off") return { renderPath: "cpu", useWorker: false, shader: null };
  if (colorMode.id === "native" || colorMode.mode === "native") return { renderPath: "native", useWorker: false, shader: null };
  if (colorMode.renderer === "webgl") return { renderPath: "webgl", useWorker: false, shader: colorMode.id };
  return { renderPath: "cpu", useWorker: false, shader: null };
}
