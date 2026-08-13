import React, { useCallback, useEffect, useRef, useState } from "react";
import { createHighlight, createNote } from "../../persistence/index.js";

/**
 * Contextual actions for text selected inside the PDF.
 *
 * Appears near the selection and offers: Copy, Highlight, Add Note, Search.
 */
export default function TextSelectionActions({
  containerRef,
  documentId,
  currentPage,
  onSearch,
  onSelectionChange,
}) {
  const [selection, setSelection] = useState(null);
  const [position, setPosition] = useState(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const barRef = useRef(null);

  // Track text selection within the PDF container.
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const handleMouseUp = () => {
      // Small delay so the selection is fully settled.
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
          setSelection(null);
          setPosition(null);
          setShowNoteInput(false);
          onSelectionChange?.(null);
          return;
        }

        // Only handle selections inside the PDF container.
        const range = sel.getRangeAt(0);
        if (!el.contains(range.commonAncestorContainer)) {
          setSelection(null);
          setPosition(null);
          setShowNoteInput(false);
          onSelectionChange?.(null);
          return;
        }

        const text = sel.toString().trim();
        if (!text) {
          setSelection(null);
          setPosition(null);
          setShowNoteInput(false);
          onSelectionChange?.(null);
          return;
        }

        const rect = range.getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();
        setSelection({ text });
        setPosition({
          top: rect.top - containerRect.top + rect.height + 8,
          left: rect.left - containerRect.left + rect.width / 2,
        });
        onSelectionChange?.({ text });
      }, 10);
    };

    const handleMouseDown = (e) => {
      // Clicking outside the action bar dismisses it.
      if (barRef.current && !barRef.current.contains(e.target)) {
        setSelection(null);
        setPosition(null);
        setShowNoteInput(false);
        onSelectionChange?.(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [containerRef, onSelectionChange]);

  const handleCopy = useCallback(() => {
    if (!selection) return;
    navigator.clipboard?.writeText(selection.text).catch(() => {
      // Fallback for older browsers.
      const ta = document.createElement("textarea");
      ta.value = selection.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setSelection(null);
    setPosition(null);
    onSelectionChange?.(null);
  }, [selection, onSelectionChange]);

  const handleHighlight = useCallback(async () => {
    if (!selection || !documentId) return;
    try {
      await createHighlight({
        documentId,
        page: currentPage,
        text: selection.text,
        rects: [],
      });
    } catch {
      // Persistence failed — ignore.
    }
    setSelection(null);
    setPosition(null);
    onSelectionChange?.(null);
  }, [selection, documentId, currentPage, onSelectionChange]);

  const handleAddNote = useCallback(async () => {
    if (!selection || !documentId) return;
    try {
      await createNote({
        documentId,
        page: currentPage,
        text: selection.text,
        note: noteText,
        rects: [],
      });
    } catch {
      // Persistence failed — ignore.
    }
    setShowNoteInput(false);
    setNoteText("");
    setSelection(null);
    setPosition(null);
    onSelectionChange?.(null);
  }, [selection, documentId, currentPage, noteText, onSelectionChange]);

  const handleSearch = useCallback(() => {
    if (!selection) return;
    onSearch?.(selection.text);
    setSelection(null);
    setPosition(null);
    onSelectionChange?.(null);
  }, [selection, onSearch, onSelectionChange]);

  if (!selection || !position) return null;

  const barStyle = {
    position: "absolute",
    top: position.top,
    left: position.left,
    transform: "translateX(-50%)",
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
  };

  const btnStyle = {
    border: "none",
    background: "none",
    color: "var(--text-h)",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 4,
    cursor: "pointer",
  };

  return (
    <div ref={barRef} style={barStyle}>
      <button style={btnStyle} onClick={handleCopy}>
        Copy
      </button>
      <button style={btnStyle} onClick={handleHighlight}>
        Highlight
      </button>
      <button
        style={btnStyle}
        onClick={() => setShowNoteInput((v) => !v)}
      >
        Add Note
      </button>
      <button style={btnStyle} onClick={handleSearch}>
        Search
      </button>
      {showNoteInput && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
          <input
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNote();
              if (e.key === "Escape") setShowNoteInput(false);
            }}
            placeholder="Note…"
            style={{
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "4px 6px",
              fontSize: 12,
              background: "var(--code-bg)",
              color: "var(--text-h)",
              width: 120,
            }}
          />
          <button
            style={{ ...btnStyle, color: "var(--accent)" }}
            onClick={handleAddNote}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}