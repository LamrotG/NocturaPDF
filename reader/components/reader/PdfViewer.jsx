import React, { useEffect, useRef, useState } from "react";
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
  documentId = null,
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

  // Keep the latest callbacks in refs so the load effect below depends only on
  // `file`. Previously `handleDocumentLoad` (from App.jsx) changed identity
  // after `updateTab` mutated the store, which re-ran the load effect *after*
  // the document had already loaded. That created a NEW document and called
  // destroy() on the live one — terminating its worker while PageCanvas /
  // PdfSearch were mid getTextContent, producing:
  //   "Warning: getTextContent - ignoring errors during ... Worker task was terminated".
  const onDocumentLoadRef = useRef(onDocumentLoad);
  onDocumentLoadRef.current = onDocumentLoad;
  const onNumPagesChangeRef = useRef(onNumPagesChange);
  onNumPagesChangeRef.current = onNumPagesChange;

  // Monotonic token identifying the newest load request. StrictMode
  // double-mounts and tab-driven re-renders both start loads; only the
  // newest one may commit state, and older invocations always settle their
  // own state instead of skipping it. (A boolean in-flight guard caused a
  // permanently stuck loading spinner: the cancelled first mount set the
  // flag, the second mount early-returned without loading, and nothing ever
  // reset isLoading — the file appeared to "never open".)
  const loadIdRef = useRef(0);

  useEffect(() => {
    const myLoad = ++loadIdRef.current;
    // A load is stale once a newer invocation has taken over.
    const isStale = () => myLoad !== loadIdRef.current;

    async function loadPdf() {
      setError("");

      if (!file) {
        setPdfDoc(null);
        setNumPages(0);
        onDocumentLoadRef.current?.(null);
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
        if (isStale()) {
          // A newer load superseded this one — release its worker so no
          // stale document/worker lingers (prevents
          // "Cannot read properties of null (reading 'sendWithPromise')"
          // in page.render()/getOptionalContentConfig()).
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
        onNumPagesChangeRef.current?.(total);
        onDocumentLoadRef.current?.(nextPdf);
      } catch (e) {
        if (!isStale()) setError(e?.message || "Failed to load PDF.");
      } finally {
        // Only the newest load owns the loading state; stale invocations
        // must not clear (or leave stuck) a newer load's spinner.
        if (!isStale()) setIsLoading(false);
      }
    }

    loadPdf();

    return () => {
      // Bumping the token on cleanup marks this invocation stale, so a load
      // that resolves after unmount/file-swap discards its result instead of
      // committing it.
      loadIdRef.current += 1;
    };
    // Intentionally depend only on `file`: callback identity changes (from
    // App.jsx's tab store mutations) must NOT re-create / destroy the pdf.js
    // document — that is what was killing the worker with in-flight
    // getTextContent calls.
  }, [file]);

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
        // Key by the document object so that switching/loading a new document
        // fully remounts the scroll tree. Without this, PageCanvas instances
        // persist across documents (keyed only by page number) and keep their
        // stale pageRef pointing at the *old* document's Page object — calling
        // render() on it crashes in getOptionalContentConfig() with
        // "Cannot read properties of null (reading 'sendWithPromise')".
        <ScrollContainer
          key={pdfDoc}
          pdfDoc={pdfDoc}
          documentId={documentId}
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