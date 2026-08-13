import React, { useEffect, useMemo, useRef, useState } from "react";
import { applyTheme, cloneImageData, drawWebglTheme } from "../../features/darkmode/darkmodeEngine.js";
import { MAX_SCALE, MIN_SCALE } from "../../utils/constants.js";
import LutWorker from "../../features/darkmode/lutWorker.js?worker";
import { runLutWorker } from "../../features/darkmode/lutWorkerPool.js";
import { Util } from "pdfjs-dist/legacy/build/pdf.mjs";

const WORKER_PIXEL_THRESHOLD = 1_600_000;
const clampScale = (value) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);

export default function PageCanvas({ pdfDoc, pageNumber, containerWidth, containerHeight, zoomFactor, fitMode = "width", colorMode, lut, isVisible, rotation = 0 }) {
  const canvasRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const sourceCtxRef = useRef(null);
  const pageRef = useRef(null);
  const renderTaskRef = useRef(null);
  const rawImageDataRef = useRef(null);
  const textLayerRef = useRef(null);
  const [unscaledSize, setUnscaledSize] = useState(null);
  const [isRendered, setIsRendered] = useState(false);
  const defaultRenderPath = useMemo(() => colorMode?.renderer === "webgl" ? "webgl" : colorMode?.mode === "native" ? "native" : "cpu", [colorMode]);
  const nativeSupportRef = useRef(null);

  const isOriginal = !colorMode || colorMode.id === "off";

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

  // ── Original mode: standard PDF.js rendering with text layer ─────────
  useEffect(() => {
    let cancelled = false;
    if (!isVisible || scale == null || !isOriginal) {
      return () => { cancelled = true; };
    }
    (async () => {
      const output = canvasRef.current;
      if (!output) return;
      const page = pageRef.current || await pdfDoc.getPage(pageNumber);
      if (cancelled) return;
      pageRef.current = page;
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

      const textLayer = textLayerRef.current;
      if (textLayer) {
        try {
          const textContent = await page.getTextContent();
          if (cancelled) return;
          textLayer.innerHTML = "";
          textLayer.style.width = `${viewport.width}px`;
          textLayer.style.height = `${viewport.height}px`;
          textLayer.style.transform = `scale(${scale})`;
          textLayer.style.transformOrigin = "0 0";

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
            div.style.pointerEvents = "none";
            textLayer.appendChild(div);
          }
        } catch (e) {
          console.warn("Text layer render failed:", e);
        }
      }
      setIsRendered(true);
    })().catch((error) => console.error(`Unable to render PDF page ${pageNumber}:`, error));
    return () => { cancelled = true; renderTaskRef.current?.cancel?.(); renderTaskRef.current = null; };
  }, [isVisible, scale, pdfDoc, pageNumber, rotation, isOriginal]);

  // ── Theme modes: render + apply LUT ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!isVisible || scale == null || isOriginal) {
      renderTaskRef.current?.cancel?.(); renderTaskRef.current = null; rawImageDataRef.current = null; setIsRendered(false);
      for (const canvas of [canvasRef.current, sourceCanvasRef.current]) if (canvas) { canvas.width = 0; canvas.height = 0; }
      return () => { cancelled = true; };
    }
    (async () => {
      const output = canvasRef.current;
      const source = sourceCanvasRef.current;
      if (!output || !source) return;
      const page = pageRef.current || await pdfDoc.getPage(pageNumber);
      if (cancelled) return;
      pageRef.current = page;
      const viewport = page.getViewport({ scale, rotation });
      source.width = output.width = Math.floor(viewport.width);
      source.height = output.height = Math.floor(viewport.height);
      const readsPixels = Boolean(lut) && defaultRenderPath === "cpu";
      try {
        sourceCtxRef.current = source.getContext("2d", { alpha: false, willReadFrequently: readsPixels });
      } catch {
        sourceCtxRef.current = source.getContext("2d") || null;
      }

      let pageColors = null;
      if (defaultRenderPath === "native" && colorMode?.mode === "native") {
        pageColors = nativeSupportRef.current === false ? null : { foreground: colorMode.fg, background: colorMode.bg };
      }

      let task = page.render({ canvas: source, viewport, pageColors });
      renderTaskRef.current = task;
      try {
        await task.promise;
        if (defaultRenderPath === "native" && pageColors && nativeSupportRef.current === null) nativeSupportRef.current = true;
      } catch (error) {
        if ((defaultRenderPath === "native" && pageColors) && nativeSupportRef.current !== false) {
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

      if (defaultRenderPath === "webgl") {
        try {
          if (!drawWebglTheme(output, source, lut, { shader: colorMode?.id })) {
            const fallbackCtx = output.getContext("2d");
            fallbackCtx?.drawImage(source, 0, 0);
          }
        } catch (err) {
          console.error("WebGL theme render failed, falling back to 2D:", err);
          const fallbackCtx = output.getContext("2d");
          fallbackCtx?.drawImage(source, 0, 0);
        }
      } else if (readsPixels) {
        const ctx = sourceCtxRef.current || source.getContext("2d");
        try {
          rawImageDataRef.current = ctx.getImageData(0, 0, source.width, source.height);
        } catch (err) {
          rawImageDataRef.current = null;
          throw err;
        }
      }
      setIsRendered(true);
    })().catch((error) => console.error(`Unable to render PDF page ${pageNumber}:`, error));
    return () => { cancelled = true; renderTaskRef.current?.cancel?.(); renderTaskRef.current = null; };
  }, [isVisible, scale, pdfDoc, pageNumber, rotation, isOriginal, colorMode, lut, defaultRenderPath]);

  // ── Apply theme pixels ─────────────────────────────────────────────
  useEffect(() => {
    if (!isVisible || !isRendered || isOriginal) return;
    const output = canvasRef.current;
    if (!output) return;

    const renderPixels = async () => {
      if (defaultRenderPath === "webgl") {
        const source = sourceCanvasRef.current;
        if (!source) return;
        try {
          if (!drawWebglTheme(output, source, lut, { shader: colorMode?.id })) {
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
      if (pixels.width * pixels.height >= WORKER_PIXEL_THRESHOLD && typeof Worker !== "undefined") {
        try {
          const result = await runLutWorker(pixels.data.buffer, lut, colorMode?.mode);
          const next = new ImageData(new Uint8ClampedArray(result), pixels.width, pixels.height);
          ctx.putImageData(next, 0, 0);
        } catch {
          ctx.putImageData(applyTheme(pixels, lut, colorMode?.mode), 0, 0);
        }
      } else {
        ctx.putImageData(applyTheme(pixels, lut, colorMode?.mode), 0, 0);
      }
    };

    renderPixels();
  }, [lut, colorMode, isVisible, isRendered, isOriginal, defaultRenderPath]);

  return <>
    <div style={{ position: "relative", width: size ? size.width : "100%", height: size ? size.height : 600 }}>
      <canvas ref={canvasRef} data-page-number={pageNumber} style={{ display: "block", width: size ? size.width : "100%", height: size ? size.height : 600, background: "#ffffff", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,.12)" }} />
      <div
        ref={textLayerRef}
        data-page-number={pageNumber}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size ? size.width : "100%",
          height: size ? size.height : 600,
          overflow: "hidden",
          pointerEvents: "none",
          userSelect: "text",
        }}
      />
    </div>
    <canvas ref={sourceCanvasRef} aria-hidden="true" style={{ display: "none" }} />
  </>;
}