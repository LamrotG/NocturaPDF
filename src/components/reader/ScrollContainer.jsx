import React, { useEffect, useMemo, useRef, useState } from "react";
import PageCanvas from "./PageCanvas.jsx";
import { MAX_SCALE, MIN_SCALE, ZOOM_STEP } from "../../utils/constants.js";

const PAGE_GAP = 16;
const COLUMN_PADDING = 12; // each side
const COLUMN_MAX_WIDTH = 900;

// Owns the scroll viewport and page virtualization: mounts a lightweight
// wrapper per page and uses a single IntersectionObserver (rootMargin gives
// a preload buffer above/below the viewport) to decide which pages actually
// render pixels via PageCanvas. Everything else stays an empty placeholder,
// so scrolling a 300-page document only ever keeps a handful of canvases
// (and their raw-pixel theme caches) alive at once.
export default function ScrollContainer({
  pdfDoc,
  numPages,
  colorMode,
  lut,
  zoomFactor,
  fitMode,
  onZoomChange,
  onCurrentPageChange,
  scrollRequest,
  rotation = 0,
}) {
  const scrollRef = useRef(null);
  const measureRef = useRef(null);
  const pageElsRef = useRef(new Map());
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [visiblePages, setVisiblePages] = useState(() => new Set());

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const update = () => setContainerWidth(el.clientWidth || 0);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tracks the scroll viewport's own visible height (not the content
  // column's, which is unbounded) — needed for fit-page mode.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => setContainerHeight(el.clientHeight || 0);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ctrl+scroll zoom — lives here (not the keyboard hook) since it needs the
  // scroll viewport's DOM node directly, and must preventDefault to stop the
  // browser's native page-zoom-on-ctrl-scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !onZoomChange) return;

    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      onZoomChange((z) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(z + delta).toFixed(2))));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onZoomChange]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const next = new Set(prev);
          let changed = false;
          for (const entry of entries) {
            const pageNumber = Number(entry.target.dataset.pageNumber);
            if (entry.isIntersecting) {
              if (!next.has(pageNumber)) {
                next.add(pageNumber);
                changed = true;
              }
            } else if (next.has(pageNumber)) {
              next.delete(pageNumber);
              changed = true;
            }
          }
          return changed ? next : prev;
        });

        if (onCurrentPageChange) {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length) {
            const top = visible.reduce((a, b) =>
              a.boundingClientRect.top < b.boundingClientRect.top ? a : b
            );
            onCurrentPageChange(Number(top.target.dataset.pageNumber));
          }
        }
      },
      {
        root,
        rootMargin: "150% 0px", // preload roughly 1.5 viewports above/below
        threshold: 0,
      }
    );

    for (const el of pageElsRef.current.values()) observer.observe(el);

    return () => observer.disconnect();
  }, [numPages, onCurrentPageChange]);

  // Imperative "jump to page" — Sidebar thumbnails/outline and the Toolbar's
  // page field drive this by passing a new { page, id } object each time
  // (the `id` forces the effect to re-fire even for repeat clicks on the
  // same page).
  useEffect(() => {
    if (!scrollRequest) return;
    const el = pageElsRef.current.get(scrollRequest.page);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollRequest]);

  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, i) => i + 1),
    [numPages]
  );

  const availableWidth = Math.max(1, containerWidth - COLUMN_PADDING * 2);

  return (
    <div ref={scrollRef} style={{ width: "100%", height: "100%", overflowY: "auto" }}>
      <div
        ref={measureRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: PAGE_GAP,
          alignItems: "center",
          maxWidth: COLUMN_MAX_WIDTH,
          margin: "0 auto",
          padding: `24px ${COLUMN_PADDING}px`,
          boxSizing: "border-box",
        }}
      >
        {pageNumbers.map((pageNumber) => (
          <div
            key={pageNumber}
            data-page-number={pageNumber}
            ref={(el) => {
              if (el) pageElsRef.current.set(pageNumber, el);
              else pageElsRef.current.delete(pageNumber);
            }}
          >
            <PageCanvas
              pdfDoc={pdfDoc}
              pageNumber={pageNumber}
              containerWidth={availableWidth}
              containerHeight={containerHeight}
              zoomFactor={zoomFactor}
              fitMode={fitMode}
              colorMode={colorMode}
              lut={lut}
              isVisible={visiblePages.has(pageNumber)}
              rotation={rotation}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
