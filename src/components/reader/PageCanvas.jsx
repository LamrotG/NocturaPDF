import React, { useEffect, useRef, useState } from "react";
import { applyTheme, cloneImageData } from "../../features/darkmode/darkmodeEngine.js";
import { MAX_SCALE, MIN_SCALE } from "../../utils/constants.js";

function clampScale(value) {
  return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
}

// Renders exactly one PDF page. Caches the raw (undarkened) pixels right
// after pdf.js renders them so switching themes just reprocesses that cache
// instead of re-invoking page.render() — this is what makes theme switching
// instant. When scrolled out of view the raw cache and canvas bitmap are
// dropped (a page's worth of ImageData is multiple MB; keeping it for every
// page in a 300-page document would exhaust memory), and re-rendered from
// pdf.js again if it scrolls back into view.
//
// Scale is derived per-page from `containerWidth`/`zoomFactor` rather than
// passed in precomputed, since fit-to-width depends on each page's own
// intrinsic size (pages in one document can differ, e.g. portrait + landscape).
export default function PageCanvas({
  pdfDoc,
  pageNumber,
  containerWidth,
  containerHeight,
  zoomFactor,
  fitMode = "width",
  colorMode,
  lut,
  isVisible,
  rotation = 0,
}) {
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const renderTaskRef = useRef(null);
  const rawImageDataRef = useRef(null);

  const [unscaledSize, setUnscaledSize] = useState(null);
  const [isRendered, setIsRendered] = useState(false);

  // Probe the page's intrinsic size once, regardless of visibility, so
  // off-screen pages still reserve the right scroll height (no layout jump
  // the first time a page scrolls into view).
  useEffect(() => {
    let cancelled = false;

    async function probeSize() {
      const page = pageRef.current || (await pdfDoc.getPage(pageNumber));
      if (cancelled) return;
      pageRef.current = page;
      const unscaled = page.getViewport({ scale: 1, rotation });
      setUnscaledSize({ width: unscaled.width, height: unscaled.height });
    }

    probeSize();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber, rotation]);

  const scale = unscaledSize
    ? clampScale(
        fitMode === "page" && containerHeight
          ? Math.min(
              containerWidth / unscaledSize.width,
              containerHeight / unscaledSize.height
            ) * zoomFactor
          : (containerWidth * zoomFactor) / unscaledSize.width
      )
    : null;
  const size =
    unscaledSize && scale
      ? {
          width: Math.floor(unscaledSize.width * scale),
          height: Math.floor(unscaledSize.height * scale),
        }
      : null;

  // Render (when visible) or tear down (when scrolled away) actual pixels.
  useEffect(() => {
    let cancelled = false;

    if (!isVisible || scale == null) {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          /* ignore: already settled */
        }
        renderTaskRef.current = null;
      }
      rawImageDataRef.current = null;
      setIsRendered(false);
      const canvas = canvasRef.current;
      if (canvas) {
        // Reassigning width discards the bitmap and repaints transparent,
        // letting the CSS `background` (theme bg) show through cleanly —
        // clearRect on an alpha:false context would paint opaque black instead.
        canvas.width = 0;
        canvas.height = 0;
      }
      return;
    }

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const page = pageRef.current || (await pdfDoc.getPage(pageNumber));
      if (cancelled) return;
      pageRef.current = page;

      const viewport = page.getViewport({ scale, rotation });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d", { alpha: false });
      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;

      try {
        await task.promise;
      } catch (e) {
        if (e?.name !== "RenderingCancelledException") throw e;
        return;
      } finally {
        renderTaskRef.current = null;
      }
      if (cancelled) return;

      const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
      rawImageDataRef.current = raw;
      ctx.putImageData(
        lut ? applyTheme(cloneImageData(raw), lut, colorMode?.mode) : raw,
        0,
        0
      );
      setIsRendered(true);
    }

    renderPage().catch(() => {});

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          /* ignore: already settled */
        }
        renderTaskRef.current = null;
      }
    };
    // `lut`/`colorMode` are intentionally excluded: this effect renders via
    // pdf.js and caches raw pixels only when visibility/scale/page changes.
    // Color mode changes are handled by the effect below, which reapplies
    // from the cache instead of re-invoking the (expensive) pdf.js render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, scale, pdfDoc, pageNumber, rotation]);

  // Reapply the color mode from the cached raw pixels — no pdf.js re-render.
  useEffect(() => {
    if (!isVisible || !isRendered) return;
    const raw = rawImageDataRef.current;
    const canvas = canvasRef.current;
    if (!raw || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.putImageData(lut ? applyTheme(cloneImageData(raw), lut, colorMode?.mode) : raw, 0, 0);
  }, [lut, colorMode, isVisible, isRendered]);

  return (
    <canvas
      ref={canvasRef}
      data-page-number={pageNumber}
      style={{
        display: "block",
        width: size ? size.width : "100%",
        height: size ? size.height : 600,
        // Never theme-derived: the main viewer must be unaffected by UI
        // theme, and stay pristine white until PDF color mode is applied.
        background: "#ffffff",
        borderRadius: 8,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
      }}
    />
  );
}
