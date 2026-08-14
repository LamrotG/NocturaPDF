import React, { useEffect, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import ScrollContainer from "./ScrollContainer.jsx";

// IMPORTANT: We set workerSrc (not workerPort). A module-level workerPort is
// transferred to the first document; when pdfDoc.destroy() runs (unmount,
// document switch, or React StrictMode double-mount) that shared worker gets
// terminated while GlobalWorkerOptions.workerPort still points at it. The next
// getDocument() then reuses the stale port and page.render() blows up with:
//   TypeError: Cannot read properties of null (reading 'sendWithPromise')
//   at getOptionalContentConfig()
// With workerSrc, pdfjs-dist creates + owns a fresh worker per document and
// destroy() cleans it up safely — no null messageHandler, no stale worker.
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
  onScrollPositionChange,
  scrollRequest,
  rotation = 0,
  initialScrollPosition = null,
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
        if (cancelled) {
          // StrictMode/dev mount churn or a file swap can cancel before the
          // document resolves — release its worker so it never lingers as a
          // stale port for a later getDocument() (which is what causes the
          // "Cannot read properties of null (reading 'sendWithPromise')"
          // error in page.render()/getOptionalContentConfig()).
          try {
            nextPdf.destroy();
          } catch {
            /* ignore */
          }
          return;
        }

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
          onScrollPositionChange={onScrollPositionChange}
          scrollRequest={scrollRequest}
          rotation={rotation}
          initialScrollPosition={initialScrollPosition}
        />
      )}

      {error && (
        <div style={{ color: "#d33", padding: "8px 16px" }}>{error}</div>
      )}

      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(24, 28, 34, 0.72)",
            zIndex: 60,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
            }}
          >
            {[...Array(5)].map((_, index) => {
              const angle = (index / 5) * Math.PI * 2;
              const x = 28 + Math.cos(angle) * 22;
              const y = 28 + Math.sin(angle) * 22;
              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#edf2f7",
                    transform: "translate(-50%, -50%)",
                    animation: "spinner-rotate 1s linear infinite",
                    animationDelay: `${index * 0.08}s`,
                  }}
                />
              );
            })}
          </div>
          <style>{`
            @keyframes spinner-rotate {
              0% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
              100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}