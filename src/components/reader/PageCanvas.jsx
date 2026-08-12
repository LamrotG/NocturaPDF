import React, { useEffect, useRef, useState } from "react";
import { applyTheme, cloneImageData, drawWebglTheme } from "../../features/darkmode/darkmodeEngine.js";
import { determineRenderDecision } from "../../features/darkmode/themeEngine.js";
import { MAX_SCALE, MIN_SCALE } from "../../utils/constants.js";
import LutWorker from "../../features/darkmode/lutWorker.js?worker";
import { runLutWorker } from "../../features/darkmode/lutWorkerPool.js";

const WORKER_PIXEL_THRESHOLD = 1_600_000;
const clampScale = (value) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);

// Render one page at a time. PDF.js always owns the source canvas; presentation
// is then selected independently (native PDF.js colors, GPU, CPU, or worker).
export default function PageCanvas({ pdfDoc, pageNumber, containerWidth, containerHeight, zoomFactor, fitMode = "width", colorMode, lut, isVisible, rotation = 0 }) {
  const canvasRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const sourceCtxRef = useRef(null);
  const pageRef = useRef(null);
  const renderTaskRef = useRef(null);
  const rawImageDataRef = useRef(null);
  const [unscaledSize, setUnscaledSize] = useState(null);
  const [isRendered, setIsRendered] = useState(false);
  const defaultRenderPath = colorMode?.renderer === "webgl" ? "webgl" : colorMode?.mode === "native" ? "native" : "cpu";
  const [effectiveRenderPath, setEffectiveRenderPath] = useState(null);
  const [effectiveUseWorker, setEffectiveUseWorker] = useState(false);
  const [effectiveShader, setEffectiveShader] = useState(null);
  const nativeSupportRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = pageRef.current || await pdfDoc.getPage(pageNumber);
      if (cancelled) return;
      pageRef.current = page;
      const viewport = page.getViewport({ scale: 1, rotation });
      setUnscaledSize({ width: viewport.width, height: viewport.height });
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber, rotation]);

  const scale = unscaledSize ? clampScale((fitMode === "page" && containerHeight ? Math.min(containerWidth / unscaledSize.width, containerHeight / unscaledSize.height) : containerWidth / unscaledSize.width) * zoomFactor) : null;
  const size = unscaledSize && scale ? { width: Math.floor(unscaledSize.width * scale), height: Math.floor(unscaledSize.height * scale) } : null;

  useEffect(() => {
    let cancelled = false;
    if (!isVisible || scale == null) {
      renderTaskRef.current?.cancel?.(); renderTaskRef.current = null; rawImageDataRef.current = null; setIsRendered(false);
      for (const canvas of [canvasRef.current, sourceCanvasRef.current]) if (canvas) { canvas.width = 0; canvas.height = 0; }
      return () => { cancelled = true; };
    }
    (async () => {
      const output = canvasRef.current;
      const usePath = effectiveRenderPath || defaultRenderPath;
      const source = usePath === "webgl" ? sourceCanvasRef.current : output;
      if (!output || !source) return;
      const page = pageRef.current || await pdfDoc.getPage(pageNumber);
      if (cancelled) return;
      pageRef.current = page;
      const viewport = page.getViewport({ scale, rotation });
      source.width = output.width = Math.floor(viewport.width); source.height = output.height = Math.floor(viewport.height);
      // PDF.js will call `getContext` internally when rendering. Create the
      // same context first with the correct `willReadFrequently` hint so the
      // browser knows ahead of time that pixel readbacks are expected. Store
      // the created context so we don't call `getContext` with different
      // option objects later (which can confuse some browsers and cause
      // warnings).
      const readsPixels = Boolean(lut) && usePath === "cpu";
      try {
        sourceCtxRef.current = source.getContext("2d", { alpha: false, willReadFrequently: readsPixels });
      } catch (e) {
        // Some environments may ignore options; fall back to a plain context.
        sourceCtxRef.current = source.getContext("2d") || null;
      }
      // Prefer PDF.js native color transform when available — attempt it
      // once per document and cache the capability. If it fails, retry
      // without `pageColors` so the pipeline falls back to GPU/CPU themes.
      let pageColors = null;
      if (usePath === "native" && colorMode?.mode === "native") {
        pageColors = nativeSupportRef.current === false ? null : { foreground: colorMode.fg, background: colorMode.bg };
      }

      let task = page.render({ canvas: source, viewport, pageColors });
      renderTaskRef.current = task;
      try {
        await task.promise;
        // If we used pageColors and haven't cached support, mark it supported
        if (usePath === "native" && pageColors && nativeSupportRef.current === null) nativeSupportRef.current = true;
      } catch (error) {
        // If native render failed and we attempted pageColors, retry without it
        if ((usePath === "native" && pageColors) && nativeSupportRef.current !== false) {
          nativeSupportRef.current = false;
          try {
            const retry = page.render({ canvas: source, viewport, pageColors: null });
            renderTaskRef.current = retry;
            await retry.promise;
          } catch (err2) {
            if (err2?.name !== "RenderingCancelledException") throw err2;
            return;
          }
        } else {
          if (error?.name !== "RenderingCancelledException") throw error;
          return;
        }
      } finally { renderTaskRef.current = null; }
      if (cancelled) return;
      if (usePath === "webgl") {
        try {
          if (!drawWebglTheme(output, source, lut, { shader: effectiveShader || colorMode?.id })) {
            const fallbackCtx = output.getContext("2d");
            fallbackCtx?.drawImage(source, 0, 0);
          }
        } catch (err) {
          console.error("WebGL theme render failed, falling back to 2D:", err);
          const fallbackCtx = output.getContext("2d");
          fallbackCtx?.drawImage(source, 0, 0);
        }
      } else if (readsPixels) {
        // Use the previously created context reference if available to
        // guarantee the same creation options and avoid extra getContext
        // calls with differing option objects.
        const ctx = sourceCtxRef.current || source.getContext("2d");
        try {
          rawImageDataRef.current = ctx.getImageData(0, 0, source.width, source.height);
        } catch (err) {
          // If readback fails for any reason, clear cached data and rethrow
          // so the error surfaces for debugging rather than silently hiding
          // it.
          rawImageDataRef.current = null;
          throw err;
        }
      }
      setIsRendered(true);
    })().catch((error) => console.error(`Unable to render PDF page ${pageNumber}:`, error));
    return () => { cancelled = true; renderTaskRef.current?.cancel?.(); renderTaskRef.current = null; };
    // Theme application below deliberately reuses cached source pixels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, scale, pdfDoc, pageNumber, rotation, effectiveRenderPath]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const decision = await determineRenderDecision(pdfDoc, pageNumber, colorMode);
        if (cancelled) return;
        setEffectiveRenderPath(decision.renderPath);
        setEffectiveUseWorker(Boolean(decision.useWorker));
        setEffectiveShader(decision.shader || null);
      } catch (e) {
        if (cancelled) return;
        setEffectiveRenderPath(null);
        setEffectiveUseWorker(false);
        setEffectiveShader(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber, colorMode]);

  useEffect(() => {
    if (!isVisible || !isRendered) return;
    const output = canvasRef.current, source = sourceCanvasRef.current;
    if (!output) return;
    const usePath = effectiveRenderPath || defaultRenderPath;

    const renderPixels = async () => {
      if (usePath === "webgl" && source) {
        try {
          if (!drawWebglTheme(output, source, lut, { shader: effectiveShader || colorMode?.id })) {
            const fallbackCtx = output.getContext("2d");
            fallbackCtx?.drawImage(source, 0, 0);
          }
        } catch (err) {
          console.error("WebGL theme render failed, falling back to 2D:", err);
          const fallbackCtx = output.getContext("2d");
          fallbackCtx?.drawImage(source, 0, 0);
        }
        return;
      }

      const raw = rawImageDataRef.current;
      if (!raw || !lut) return;
      const ctx = output.getContext("2d", { alpha: false, willReadFrequently: true });
      const pixels = cloneImageData(raw);
      if ((effectiveUseWorker || pixels.width * pixels.height >= WORKER_PIXEL_THRESHOLD) && typeof Worker !== "undefined") {
        try {
          const result = await runLutWorker(pixels.data.buffer, lut, colorMode?.mode);
          const next = new ImageData(new Uint8ClampedArray(result), pixels.width, pixels.height);
          ctx.putImageData(next, 0, 0);
        } catch (err) {
          // Fall back to main-thread processing on worker failure
          ctx.putImageData(applyTheme(pixels, lut, colorMode?.mode), 0, 0);
        }
      } else {
        ctx.putImageData(applyTheme(pixels, lut, colorMode?.mode), 0, 0);
      }
    };

    renderPixels();
  }, [lut, colorMode, isVisible, isRendered, effectiveRenderPath, effectiveShader]);

  return <><canvas ref={canvasRef} data-page-number={pageNumber} style={{ display: "block", width: size ? size.width : "100%", height: size ? size.height : 600, background: "#ffffff", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,.12)" }} />
    <canvas ref={sourceCanvasRef} aria-hidden="true" style={{ display: "none" }} /></>;
}
