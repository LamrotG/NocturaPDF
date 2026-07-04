import React, { useEffect, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import ScrollContainer from "./ScrollContainer.jsx";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Owns document load/lifecycle only — per-page rendering, virtualization and
// theme application live in ScrollContainer/PageCanvas.
export default function PdfViewer({
  file,
  colorMode,
  lut,
  zoomFactor = 1,
  fitMode,
  onZoomChange,
  onCurrentPageChange,
  onNumPagesChange,
  onDocumentLoad,
  scrollRequest,
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setError("");

      if (!file) {
        setPdfDoc(null);
        setNumPages(0);
        onDocumentLoad?.(null);
        return;
      }

      setIsLoading(true);

      try {
        let src;
        if (file instanceof File) {
          src = { data: new Uint8Array(await file.arrayBuffer()) };
        } else if (typeof file === "string") {
          src = { url: file };
        } else if (file instanceof Uint8Array) {
          src = { data: file };
        } else if (file instanceof ArrayBuffer) {
          src = { data: new Uint8Array(file) };
        } else {
          throw new Error(
            "Unsupported `file` prop. Use File, URL string, Uint8Array, or ArrayBuffer."
          );
        }

        const loadingTask = getDocument(src);
        const nextPdf = await loadingTask.promise;
        if (cancelled) return;

        setPdfDoc((prev) => {
          if (prev && prev !== nextPdf) {
            try {
              prev.destroy();
            } catch {
              /* ignore: prev doc already gone */
            }
          }
          return nextPdf;
        });
        const total = nextPdf.numPages || 0;
        setNumPages(total);
        onNumPagesChange?.(total);
        onDocumentLoad?.(nextPdf);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load PDF.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [file, onDocumentLoad, onNumPagesChange]);

  // Destroy the pdf.js document on unmount or when it's replaced.
  useEffect(() => {
    return () => {
      if (pdfDoc) {
        try {
          pdfDoc.destroy();
        } catch {
          /* ignore: already destroyed */
        }
      }
    };
  }, [pdfDoc]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {error && (
        <div style={{ color: "#d33", padding: "8px 16px" }}>{error}</div>
      )}
      {isLoading && (
        <div style={{ opacity: 0.8, padding: "8px 16px" }}>Loading PDF…</div>
      )}

      {pdfDoc && numPages > 0 && (
        <ScrollContainer
          pdfDoc={pdfDoc}
          numPages={numPages}
          colorMode={colorMode}
          lut={lut}
          zoomFactor={zoomFactor}
          fitMode={fitMode}
          onZoomChange={onZoomChange}
          onCurrentPageChange={onCurrentPageChange}
          scrollRequest={scrollRequest}
        />
      )}
    </div>
  );
}
