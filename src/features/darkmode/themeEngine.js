// Lightweight document analysis to choose an appropriate rendering path.
// This module caches analysis per PDF document and page, and exposes a
// decision function to tell the renderer whether to use CPU/WebGL/Native
// and whether expensive pixel processing should be moved to a worker.

const analysisCache = new WeakMap();

async function ensurePage(pdfDoc, pageNumber) {
  const page = await pdfDoc.getPage(pageNumber);
  return page;
}

export async function analyzePage(pdfDoc, pageNumber) {
  let docMap = analysisCache.get(pdfDoc);
  if (!docMap) { docMap = new Map(); analysisCache.set(pdfDoc, docMap); }
  if (docMap.has(pageNumber)) return docMap.get(pageNumber);

  const page = await ensurePage(pdfDoc, pageNumber);
  const text = await page.getTextContent().catch(() => ({ items: [] }));
  const textItems = (text && text.items) ? text.items.length : 0;

  // Render at a small scale to get a quick pixel sample for classification.
  const sampleScale = 0.25;
  const viewport = page.getViewport({ scale: sampleScale });
  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(Math.max(1, Math.floor(viewport.width)), Math.max(1, Math.floor(viewport.height))) : document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");

  try {
    const task = page.render({ canvas, viewport });
    await task.promise;
  } catch (e) {
    // If rendering fails, classify conservatively as 'hybrid'
    const result = { textItems, classification: "hybrid", width: canvas.width, height: canvas.height };
    docMap.set(pageNumber, result);
    return result;
  }

  let data;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch (e) {
    const result = { textItems, classification: "hybrid", width: canvas.width, height: canvas.height };
    docMap.set(pageNumber, result);
    return result;
  }

  const total = canvas.width * canvas.height;
  let colorPixels = 0;
  let darkPixels = 0;
  let lumaSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    lumaSum += luma;
    if (max - min > 16) colorPixels += 1; // colored pixel when channels differ
    if (luma < 40) darkPixels += 1;
  }
  const avgLuma = lumaSum / total;
  const colorRatio = colorPixels / total;
  const darkRatio = darkPixels / total;

  let classification = "hybrid";
  if (textItems > 20 && colorRatio < 0.1) classification = "digital";
  else if (colorRatio > 0.25) classification = "image-heavy";
  else if (avgLuma > 200 || darkRatio > 0.6) classification = "scanned";
  else classification = "hybrid";

  const result = { textItems, classification, width: canvas.width, height: canvas.height };
  docMap.set(pageNumber, result);
  return result;
}

export async function determineRenderDecision(pdfDoc, pageNumber, colorMode) {
  // colorMode: the chosen PDF_COLOR_MODES entry (may be null)
  if (!colorMode || colorMode.id === "off") return { renderPath: "cpu", useWorker: false, shader: null };
  // explicit native preference
  if (colorMode.id === "native" || colorMode.mode === "native") return { renderPath: "native", useWorker: false, shader: null };

  // explicit GPU preference
  if (colorMode.renderer === "webgl") return { renderPath: "webgl", useWorker: false, shader: colorMode.id };

  // Otherwise, analyze the page to pick a good path for 'smart' etc.
  try {
    const analysis = await analyzePage(pdfDoc, pageNumber);
    const { classification, width, height } = analysis;
    const pixelCount = width * height;
    const useWorker = pixelCount >= 1_600_000 || classification === "image-heavy";

    if (colorMode.id === "smart") {
      if (classification === "digital") return { renderPath: "native", useWorker: false, shader: null };
      if (classification === "scanned") return { renderPath: "cpu", useWorker: true, shader: null };
      if (classification === "image-heavy") return { renderPath: "webgl", useWorker: false, shader: "gpuDark" };
      return { renderPath: "cpu", useWorker, shader: null };
    }

    // For scan/preserve modes, prefer CPU with worker for large pages.
    if (colorMode.id === "scan") return { renderPath: "cpu", useWorker: true, shader: null };
    if (colorMode.id === "preserve") return { renderPath: "cpu", useWorker, shader: null };

    // Fallback: use CPU path and worker for large pages.
    return { renderPath: "cpu", useWorker, shader: null };
  } catch (e) {
    // On errors, be conservative and use CPU simple path.
    return { renderPath: colorMode.renderer === "webgl" ? "webgl" : "cpu", useWorker: false, shader: colorMode.renderer === "webgl" ? colorMode.id : null };
  }
}
