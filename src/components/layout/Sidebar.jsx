import React, { useEffect, useMemo, useRef, useState } from "react";
import { applyTheme } from "../../features/darkmode/darkmodeEngine.js";

const THUMB_WIDTH = 120;
const SIDEBAR_WIDTH = 220;

function Thumbnail({ pdfDoc, pageNumber, isVisible, isActive, onClick, colorMode, lut }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!isVisible) return;

    async function render() {
      const page = await pdfDoc.getPage(pageNumber);
      if (cancelled) return;

      const unscaled = page.getViewport({ scale: 1 });
      const scale = THUMB_WIDTH / unscaled.width;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d", { alpha: false });
      const task = page.render({ canvasContext: ctx, viewport });
      try {
        await task.promise;
      } catch (e) {
        if (e?.name !== "RenderingCancelledException") throw e;
        return;
      }
      if (cancelled) return;

      if (lut) {
        const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.putImageData(applyTheme(raw, lut, colorMode?.mode), 0, 0);
      }
      setRendered(true);
    }

    render().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber, isVisible, lut, colorMode]);

  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: 6,
        border: isActive ? "2px solid var(--accent)" : "2px solid transparent",
        borderRadius: 6,
        background: "none",
        cursor: "pointer",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: rendered ? "auto" : 150,
          background: "#ffffff",
          borderRadius: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      />
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, color: "var(--text)" }}>
        {pageNumber}
      </div>
    </button>
  );
}

function OutlineList({ items, onSelect }) {
  if (!items.length) {
    return (
      <div style={{ fontSize: 12, opacity: 0.6, padding: 8, color: "var(--text)" }}>
        No outline in this document.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li key={i}>
          <button
            onClick={() => onSelect(item.dest)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "4px 6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-h)",
            }}
          >
            {item.title}
          </button>
          {item.items && item.items.length > 0 && (
            <div style={{ paddingLeft: 12 }}>
              <OutlineList items={item.items} onSelect={onSelect} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function tabButtonStyle(active) {
  return {
    flex: 1,
    padding: "6px 8px",
    fontSize: 12,
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    background: active ? "var(--accent-bg)" : "transparent",
    color: active ? "var(--accent)" : "var(--text)",
  };
}

// Page thumbnails (virtualized the same way as ScrollContainer — a 300 page
// document would otherwise eagerly render 300 thumbnail canvases) plus a
// document outline/bookmarks view when the PDF has one.
export default function Sidebar({
  pdfDoc,
  numPages,
  currentPage,
  onJumpToPage,
  colorMode,
  lut,
  collapsed,
}) {
  const [mode, setMode] = useState("thumbnails");
  const [outline, setOutline] = useState(null);
  const listRef = useRef(null);
  const itemElsRef = useRef(new Map());
  const [visiblePages, setVisiblePages] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    // No reset-to-null needed when pdfDoc clears: Sidebar renders its own
    // "open a PDF" placeholder whenever pdfDoc is falsy, so stale outline
    // state is never displayed and gets overwritten once a new doc loads.
    if (!pdfDoc) return;
    pdfDoc
      .getOutline()
      .then((o) => {
        if (!cancelled) setOutline(o || []);
      })
      .catch(() => {
        if (!cancelled) setOutline([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);

  useEffect(() => {
    const root = listRef.current;
    if (!root || mode !== "thumbnails") return;

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
      },
      { root, rootMargin: "100% 0px", threshold: 0 }
    );

    for (const el of itemElsRef.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [numPages, mode]);

  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, i) => i + 1),
    [numPages]
  );

  const handleOutlineClick = async (dest) => {
    if (!pdfDoc || !dest) return;
    try {
      const resolved = typeof dest === "string" ? await pdfDoc.getDestination(dest) : dest;
      if (!resolved || !resolved[0]) return;
      const pageIndex = await pdfDoc.getPageIndex(resolved[0]);
      onJumpToPage?.(pageIndex + 1);
    } catch {
      /* ignore: unresolvable destination */
    }
  };

  if (collapsed) return null;

  if (!pdfDoc) {
    return (
      <div
        style={{
          width: SIDEBAR_WIDTH,
          padding: 16,
          opacity: 0.6,
          fontSize: 13,
          color: "var(--text)",
          borderRight: "1px solid var(--border)",
        }}
      >
        Open a PDF to see its pages and outline here.
      </div>
    );
  }

  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <div style={{ display: "flex", gap: 4, padding: 8 }}>
        <button style={tabButtonStyle(mode === "thumbnails")} onClick={() => setMode("thumbnails")}>
          Pages
        </button>
        <button
          style={tabButtonStyle(mode === "outline")}
          onClick={() => setMode("outline")}
          disabled={!outline || outline.length === 0}
        >
          Outline
        </button>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {mode === "thumbnails" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pageNumbers.map((pageNumber) => (
              <div
                key={pageNumber}
                data-page-number={pageNumber}
                ref={(el) => {
                  if (el) itemElsRef.current.set(pageNumber, el);
                  else itemElsRef.current.delete(pageNumber);
                }}
              >
                <Thumbnail
                  pdfDoc={pdfDoc}
                  pageNumber={pageNumber}
                  isVisible={visiblePages.has(pageNumber)}
                  isActive={pageNumber === currentPage}
                  onClick={() => onJumpToPage?.(pageNumber)}
                  colorMode={colorMode}
                  lut={lut}
                />
              </div>
            ))}
          </div>
        ) : (
          <OutlineList items={outline || []} onSelect={handleOutlineClick} />
        )}
      </div>
    </div>
  );
}
