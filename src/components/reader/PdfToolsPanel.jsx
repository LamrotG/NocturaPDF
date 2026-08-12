import React, { useCallback, useEffect, useRef, useState } from "react";
import { MousePointer2, Highlighter, Bookmark } from "lucide-react";
import { createHighlight, createBookmark } from "../../persistence/index.js";

const HIGHLIGHT_COLORS = [
  { id: "green", label: "Green", color: "#4caf50" },
  { id: "orange", label: "Orange", color: "#ff9800" },
  { id: "red", label: "Red", color: "#f44336" },
  { id: "purple", label: "Purple", color: "#9c27b0" },
  { id: "yellow", label: "Yellow", color: "#ffeb3b" },
];

/**
 * Floating vertical tool tab shown on the left side of the PDF viewer.
 * Draggable via the top handle. Contains Select Text, Highlight, and Bookmark tools.
 * Extensible — additional tools can be added to the `tools` array.
 */
export default function PdfToolsPanel({
  containerRef,
  documentId,
  currentPage,
  onToolChange,
  activeTool,
}) {
  const [position, setPosition] = useState({ x: 12, y: 80 });
  const [dragging, setDragging] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const dragStartRef = useRef(null);
  const panelRef = useRef(null);

  const tools = [
    { id: "select", label: "Select text", icon: <MousePointer2 size={16} />, onClick: () => onToolChange?.("select") },
    { id: "highlight", label: "Highlight", icon: <Highlighter size={16} />, onClick: () => {
      setShowHighlightColors((v) => !v);
      onToolChange?.("highlight");
    } },
    { id: "bookmark", label: "Bookmark", icon: <Bookmark size={16} />, onClick: handleBookmark },
  ];

  async function handleBookmark() {
    if (!documentId) return;
    try {
      await createBookmark({ documentId, page: currentPage });
      setBookmarked(true);
      setTimeout(() => setBookmarked(false), 1500);
    } catch {
      // ignore
    }
  }

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, pos: position };
  }, [position]);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const container = containerRef?.current;
      const maxX = container ? container.clientWidth - 60 : window.innerWidth - 60;
      const maxY = container ? container.clientHeight - 60 : window.innerHeight - 60;
      setPosition({
        x: Math.max(0, Math.min(maxX, dragStartRef.current.pos.x + dx)),
        y: Math.max(0, Math.min(maxY, dragStartRef.current.pos.y + dy)),
      });
    };

    const onMouseUp = () => setDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, containerRef]);

  const handleHighlightColor = async (color) => {
    if (!documentId) return;
    try {
      // Get current selection if any
      const sel = window.getSelection();
      const text = sel && !sel.isCollapsed ? sel.toString().trim() : "";
      await createHighlight({
        documentId,
        page: currentPage,
        text: text || "Highlight",
        rects: [],
        color,
      });
    } catch {
      // ignore
    }
    setShowHighlightColors(false);
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "6px 4px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--bg)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        cursor: dragging ? "grabbing" : "default",
        userSelect: "none",
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: 28,
          height: 4,
          borderRadius: 2,
          background: "var(--border)",
          cursor: "grab",
          marginBottom: 4,
        }}
        title="Drag to move"
      />

      {tools.map((tool) => (
        <div key={tool.id} style={{ position: "relative" }}>
          <button
            onClick={tool.onClick}
            title={tool.label}
            aria-label={tool.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              border: "none",
              borderRadius: 8,
              background: activeTool === tool.id ? "var(--accent-bg)" : "transparent",
              color: activeTool === tool.id ? "var(--accent)" : "var(--text-h)",
              cursor: "pointer",
            }}
          >
            {tool.icon}
          </button>

          {/* Highlight color picker */}
          {tool.id === "highlight" && showHighlightColors && (
            <div
              style={{
                position: "absolute",
                left: "calc(100% + 8px)",
                top: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: 6,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                zIndex: 40,
              }}
            >
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleHighlightColor(c.color)}
                  title={c.label}
                  aria-label={`Highlight ${c.label}`}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "2px solid var(--border)",
                    background: c.color,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {bookmarked && (
        <div
          style={{
            position: "absolute",
            left: "calc(100% + 8px)",
            top: "50%",
            transform: "translateY(-50%)",
            padding: "4px 10px",
            borderRadius: 6,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 12,
            whiteSpace: "nowrap",
            zIndex: 40,
          }}
        >
          Bookmarked!
        </div>
      )}
    </div>
  );
}