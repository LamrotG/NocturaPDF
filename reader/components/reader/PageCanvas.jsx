import React, { useEffect, useMemo, useRef, useState } from "react";
import { applyTheme, drawWebglTheme } from "../../features/darkmode/darkmodeEngine.js";
import { MAX_SCALE, MIN_SCALE } from "../../utils/constants.js";
import { runLutWorker } from "../../features/darkmode/lutWorkerPool.js";
import { ANNOTATIONS_CHANGED_EVENT, getPageAnnotations } from "../../persistence/index.js";
import { Util } from "pdfjs-dist/legacy/build/pdf.mjs";

const WORKER_PIXEL_THRESHOLD = 1_600_000;
// The CPU recolor path renders its hidden source at 2x and averages it back
// down, which is what restores glyph-edge resolution at normal zoom (see the
// supersampling note in the themed render effect). Capped so the extra render
// cost stays bounded — viewports above this are already high resolution.
const SUPER_SAMPLE_MAX_PIXELS = 6_000_000;
const clampScale = (value) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);

// Stored highlights (IndexedDB annotations) carry page-relative normalized
// rects; this converts them back to CSS pixels of the current page box so
// they stay correct across zoom, resize, rotation and theme re-renders.
function hexToRgba(hex, alpha) {
  const fallback = `rgba(247, 224, 107, ${alpha})`;
  if (typeof hex !== "string") return fallback;
  let h = hex.replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Shared text-layer builder used by BOTH the Original and themed render
// paths, so text selection / search anchors stay aligned no matter which
// mode painted the pixels (previously only Original built a layer). Item
// transforms are already in final (scaled) page pixels — the old layer also
// applied an extra CSS `scale()` on top, double-scaling every glyph box out
// of alignment; that transform is intentionally gone.
//
// Selection needs hit-testing: a browser cannot start a selection range on
// elements that are `pointer-events: none`, and the layer AND every glyph div
// used to disable it — which is why no text was selectable in any mode. The
// glyphs are transparent and sit above the canvas, so making them
// interactive only enables selection; wheel scrolling and every parent
// handler still work because pointer events bubble.
//
// Each run is also width-corrected with `scaleX` (the same technique pdf.js'
// own TextLayer uses): the PDF font's advance width almost never matches this
// fallback font's, so long lines drifted away from the painted glyphs and
// hit-testing landed beside the visible text.
async function renderTextLayer(textLayer, page, viewport, isStale) {
  if (!textLayer) return;
  try {
    if (isStale()) return;
    // If the owning document is no longer the current one (a new document
    // was loaded and destroyed this worker), don't issue a getTextContent —
    // it would fail with "Worker task was terminated".
    const textContent = await page.getTextContent();
    if (isStale()) return;
    textLayer.innerHTML = "";
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;
    textLayer.style.transform = "none";

    const glyphs = [];
    const fragment = document.createDocumentFragment();
    for (const item of textContent.items) {
      if (!item.str || !item.transform) continue;
      const tx = Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.hypot(tx[2], tx[3]);
      const fontAscent = fontHeight * (item.height ? 0.8 : 1);
      const div = document.createElement("div");
      div.textContent = item.str;
      div.style.position = "absolute";
      div.style.left = `${tx[4]}px`;
      div.style.top = `${tx[5] - fontAscent}px`;
      div.style.fontSize = `${fontHeight}px`;
      div.style.fontFamily = "sans-serif";
      div.style.lineHeight = "1";
      div.style.whiteSpace = "pre";
      div.style.transformOrigin = "0 0";
      div.style.color = "transparent";
      div.style.pointerEvents = "auto";
      div.style.userSelect = "text";
      // Target width in the same (page pixel) units as the div: item.width is
      // in text space, so it is converted through the run's own font size.
      // Mirrors pdf.js, which only widths multiple-character runs.
      let targetWidth = null;
      const textSpaceFontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]);
      // Rotated/sheared runs are skipped — scaleX assumes a horizontal run.
      const horizontal = Math.abs(tx[1]) < 1e-3 && Math.abs(tx[2]) < 1e-3;
      if (horizontal && item.width > 0 && textSpaceFontSize > 0 && item.str.length > 1) {
        targetWidth = (item.width * fontHeight) / textSpaceFontSize;
      }
      glyphs.push({ div, targetWidth });
      fragment.appendChild(div);
    }

    textLayer.appendChild(fragment);

    // Two passes: read every width first (one layout, since nothing is
    // written in between), then write only transforms — so this can't turn
    // into a per-glyph reflow.
    const measured = glyphs.map(({ div }) => div.getBoundingClientRect().width);
    glyphs.forEach(({ div, targetWidth }, index) => {
      if (!targetWidth) return;
      const width = measured[index];
      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(targetWidth) || targetWidth <= 0) return;
      const scaleX = Math.min(Math.max(targetWidth / width, 0.25), 4);
      div.style.transform = `scaleX(${scaleX})`;
    });
  } catch (e) {
    console.warn("Text layer render failed:", e);
  }
}

export default function PageCanvas({ pdfDoc, pageNumber, documentId = null, containerWidth, containerHeight, zoomFactor, fitMode = "width", colorMode, lut, isVisible, rotation = 0 }) {
  const canvasRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const sourceCtxRef = useRef(null);
  const pageRef = useRef(null);
  const pageOwnerRef = useRef(null); // pdfDoc that pageRef.current belongs to
  const pdfDocRef = useRef(pdfDoc);
  pdfDocRef.current = pdfDoc;
  const renderTaskRef = useRef(null);
  const textLayerRef = useRef(null);
  // Stored highlight annotations for this page (rendered as a translucent
  // overlay between the canvas and the text layer). Loaded from IndexedDB
  // whenever the page becomes visible and whenever annotations change.
  const [pageHighlights, setPageHighlights] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!documentId || !isVisible) {
      if (!isVisible) setPageHighlights([]);
      return () => { cancelled = true; };
    }
    const load = async () => {
      try {
        const anns = await getPageAnnotations(documentId, pageNumber);
        if (!cancelled && pageOwnerRef.current === pdfDocRef.current) {
          setPageHighlights(anns.filter((a) => a && a.type === "highlight" && Array.isArray(a.rects) && a.rects.length > 0));
        }
      } catch {
        // IndexedDB unavailable — show no highlights.
      }
    };
    load();
    const onChanged = (e) => {
      if (e?.detail?.documentId !== documentId) return;
      if (e?.detail?.page != null && Number(e.detail.page) !== pageNumber) return;
      load();
    };
    window.addEventListener(ANNOTATIONS_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(ANNOTATIONS_CHANGED_EVENT, onChanged);
    };
  }, [documentId, pageNumber, isVisible]);

  // Only hand out a cached Page if it belongs to the *current* document.
  // Otherwise a page cached from a previous (now destroyed) pdfDoc would be
  // passed to render(), which then crashes in getOptionalContentConfig():
  //   TypeError: Cannot read properties of null (reading 'sendWithPromise')
  const getPageSafe = async (pageNumber) => {
    if (pageRef.current && pageOwnerRef.current === pdfDocRef.current) {
      return pageRef.current;
    }
    pageRef.current = null;
    const fresh = await pdfDocRef.current.getPage(pageNumber);
    pageRef.current = fresh;
    pageOwnerRef.current = pdfDocRef.current;
    return fresh;
  };
  const [unscaledSize, setUnscaledSize] = useState(null);
  // Original-first invariant: a file is ALWAYS rendered exactly as-is unless
  // a valid, explicitly non-"off" theme is selected. "off" can never resolve
  // to a themed render path no matter what fields a mode object carries.
  const defaultRenderPath = useMemo(() => {
    if (!colorMode || colorMode.id === "off") return "cpu";
    return colorMode.renderer === "webgl" ? "webgl" : "cpu";
  }, [colorMode]);

  const isOriginal = !colorMode || colorMode.id === "off";
  // Themed pages pre-paint with the theme background so there's no white
  // flash while the hidden source render is in progress.
  const pageBackground = isOriginal || !colorMode ? "#ffffff" : colorMode.bg || "#ffffff";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await getPageSafe(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1, rotation });
      setUnscaledSize({ width: viewport.width, height: viewport.height });
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber, rotation]);

  const scale = unscaledSize ? clampScale((fitMode === "page" && containerHeight ? Math.min(containerWidth / unscaledSize.width, containerHeight / unscaledSize.height) : containerWidth / unscaledSize.width) * zoomFactor) : null;
  const size = unscaledSize && scale ? { width: Math.floor(unscaledSize.width * scale), height: Math.floor(unscaledSize.height * scale) } : null;

  // ── Original mode: standard PDF.js rendering with text layer ─────────
  useEffect(() => {
    let cancelled = false;
    if (!isVisible || scale == null || !isOriginal) {
      return () => { cancelled = true; };
    }
    const isStale = () => cancelled || pageOwnerRef.current !== pdfDocRef.current;
    (async () => {
      const output = canvasRef.current;
      if (!output) return;
      const page = await getPageSafe(pageNumber);
      if (isStale()) return;
      const viewport = page.getViewport({ scale, rotation });
      output.width = Math.floor(viewport.width);
      output.height = Math.floor(viewport.height);
      const task = page.render({ canvas: output, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (error) {
        if (error?.name !== "RenderingCancelledException") throw error;
        return;
      } finally {
        renderTaskRef.current = null;
      }
      if (cancelled) return;

      await renderTextLayer(textLayerRef.current, page, viewport, isStale);
    })().catch((error) => console.error(`Unable to render PDF page ${pageNumber}:`, error));
    return () => { cancelled = true; renderTaskRef.current?.cancel?.(); renderTaskRef.current = null; };
  }, [isVisible, scale, pdfDoc, pageNumber, rotation, isOriginal]);

  // ── Theme modes: render, recolor, and paint the visible canvas ─────
  useEffect(() => {
    let cancelled = false;
    if (!isVisible || scale == null || isOriginal) {
      renderTaskRef.current?.cancel?.();
      renderTaskRef.current = null;
      for (const canvas of [canvasRef.current, sourceCanvasRef.current]) if (canvas) { canvas.width = 0; canvas.height = 0; }
      if (textLayerRef.current) textLayerRef.current.innerHTML = "";
      return () => { cancelled = true; };
    }
    const isStale = () => cancelled || pageOwnerRef.current !== pdfDocRef.current;
    (async () => {
      const output = canvasRef.current;
      const source = sourceCanvasRef.current;
      if (!output || !source) return;
      const page = await getPageSafe(pageNumber);
      if (isStale()) return;
      const viewport = page.getViewport({ scale, rotation });
      // Supersampling (CPU recolor path only): the theming pipeline needs a
      // *neutral*, grayscale-anti-aliased source render — that is what keeps
      // the mapping clean and fringe-free — but grayscale AA costs horizontal
      // edge resolution versus the subpixel AA the visible canvas gets in
      // Original mode. That is why themed text looked softer than the original
      // at 100% zoom and only "got better when zoomed in". Rendering the hidden
      // source at 2x and averaging it back down in *mapped* space restores that
      // resolution (the averaging happens after the recolor, so edges blend
      // correctly instead of being mapped pixel-by-pixel). Capped, and skipped
      // for the WebGL path so the GPU themes' geometry/output stay untouched.
      const baseWidth = Math.floor(viewport.width);
      const baseHeight = Math.floor(viewport.height);
      const supersample = defaultRenderPath === "cpu" && baseWidth * 2 * (baseHeight * 2) <= SUPER_SAMPLE_MAX_PIXELS ? 2 : 1;
      const renderViewport = supersample === 1 ? viewport : page.getViewport({ scale: scale * supersample, rotation });
      output.width = baseWidth;
      output.height = baseHeight;
      source.width = Math.floor(renderViewport.width);
      source.height = Math.floor(renderViewport.height);
      try {
        // willReadFrequently also makes the browser rasterize this hidden
        // canvas without subpixel (LCD) text AA, i.e. with neutral grey glyph
        // edges — required so recoloring can't turn edge fringes into a
        // rainbow halo.
        sourceCtxRef.current = source.getContext("2d", { alpha: false, willReadFrequently: true });
      } catch {
        sourceCtxRef.current = source.getContext("2d") || null;
      }
      const outCtx = output.getContext("2d", { alpha: false });

      // Every themed mode ends by painting the visible canvas from the
      // hidden source render — Native included. Native previously painted
      // only the hidden canvas and never blitted, leaving the visible page
      // blank/stale while the code "succeeded". The scaled draw is a no-op
      // resample when supersampling is off.
      const blitSourceToOutput = () => {
        if (!outCtx) return;
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = "high";
        outCtx.drawImage(source, 0, 0, output.width, output.height);
      };
      // CPU fallback for when WebGL is unavailable or the GPU pipeline
      // fails. Previously this drew the *raw white page*, which made Pure
      // Black / GPU Dark look like they "did nothing" without WebGL. Large
      // pages are processed in a Web Worker so the main thread never blocks
      // (restores the pre-refactor fast path for big/high-DPI pages).
      const fallbackCpuTheme = async () => {
        if (!lut) {
          blitSourceToOutput();
          return;
        }
        const sourceCtx = sourceCtxRef.current || source.getContext("2d", { alpha: false, willReadFrequently: true });
        if (!sourceCtx) return;
        const raw = sourceCtx.getImageData(0, 0, source.width, source.height);
        let themed = null;
        let transferred = false;
        if (raw.width * raw.height >= WORKER_PIXEL_THRESHOLD && typeof Worker !== "undefined") {
          try {
            // The pixel buffer is transferred to the worker, so it is detached
            // afterwards whether or not the task succeeds.
            transferred = true;
            const result = await runLutWorker(raw.data.buffer, lut, colorMode?.mode);
            if (isStale()) return;
            themed = new ImageData(new Uint8ClampedArray(result), raw.width, raw.height);
          } catch {
            // Worker unavailable/failed — fall through to synchronous processing.
          }
        }
        if (!themed) {
          // Re-read when the buffer went to the worker (recoloring a detached
          // buffer would yield nothing).
          const pixels = transferred ? sourceCtx.getImageData(0, 0, source.width, source.height) : raw;
          themed = applyTheme(pixels, lut, colorMode?.mode);
        }
        // Write the recoloured raster back into the hidden source so the one
        // scaled blit below can average it down onto the visible canvas.
        sourceCtx.putImageData(themed, 0, 0);
        blitSourceToOutput();
      };

      // Every theme renders into the hidden source canvas and is recolored
      // below — WebGL shader for GPU Dark / Pure Black, CPU LUT pipeline for
      // Smart / Native / Scan / Preserve. pdf.js's own `pageColors` is no
      // longer used for Native: it softened glyph rasterization (very
      // visible when zoomed in) and recolored images too, which Native is
      // supposed to preserve.
      const task = page.render({ canvas: source, viewport: renderViewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (error) {
        if (error?.name !== "RenderingCancelledException") throw error;
        return;
      } finally {
        renderTaskRef.current = null;
      }
      if (isStale()) return;

      if (defaultRenderPath === "webgl") {
        let painted = false;
        try {
          painted = drawWebglTheme(output, source, lut, { shader: colorMode?.id }) === true;
        } catch (err) {
          console.error("WebGL theme render failed, falling back to CPU:", err);
        }
        // drawWebglTheme also returns false (without throwing) when no WebGL
        // context could be created — without this check nothing would be
        // painted at all and Pure Black / GPU Dark would look like they "did
        // nothing".
        if (!painted) await fallbackCpuTheme();
      } else {
        await fallbackCpuTheme();
      }

      await renderTextLayer(textLayerRef.current, page, viewport, isStale);
    })().catch((error) => console.error(`Unable to render PDF page ${pageNumber}:`, error));
    return () => { cancelled = true; renderTaskRef.current?.cancel?.(); renderTaskRef.current = null; };
  }, [isVisible, scale, pdfDoc, pageNumber, rotation, isOriginal, colorMode, lut, defaultRenderPath]);

  return <>
    <div style={{ position: "relative", width: size ? size.width : "100%", height: size ? size.height : 600 }}>
      <canvas ref={canvasRef} data-page-number={pageNumber} style={{ display: "block", width: size ? size.width : "100%", height: size ? size.height : 600, background: pageBackground, borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,.12)" }} />
      {/* Stored highlight annotations (rendered from normalized page-relative
          rects, so they follow zoom/resize/rotation/theme). pointer-events:
          none — it sits *under* the interactive text layer, which must stay
          hittable for selection. */}
      {pageHighlights.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size ? size.width : "100%",
            height: size ? size.height : 600,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {pageHighlights.flatMap((ann) =>
            (ann.rects || []).map((r, i) => (
              <div
                key={`${ann.id}-${i}`}
                style={{
                  position: "absolute",
                  left: `${r.x * 100}%`,
                  top: `${r.y * 100}%`,
                  width: `${r.w * 100}%`,
                  height: `${r.h * 100}%`,
                  background: hexToRgba(ann.color, 0.35),
                  borderRadius: 2,
                }}
              />
            ))
          )}
        </div>
      )}
      <div
        ref={textLayerRef}
        data-page-number={pageNumber}
        className="pdf-text-layer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size ? size.width : "100%",
          height: size ? size.height : 600,
          overflow: "hidden",
          // Must stay hittable for text selection: with `none` (the old
          // value) the browser could never start a selection range, in any
          // mode. Pointer events still bubble to every parent handler.
          pointerEvents: "auto",
          userSelect: "text",
          cursor: "text",
        }}
      />
    </div>
    <canvas ref={sourceCanvasRef} aria-hidden="true" style={{ display: "none" }} />
  </>;
}