import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "../icons.jsx";

/**
 * In-document PDF search.
 *
 * Uses pdf.js text content to find matches, then scrolls to them.
 * Works fully offline — no external search API.
 */
export default function PdfSearch({ pdfDoc, onJumpToPage, onClose, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const searchSeqRef = useRef(0);

  // Search the document for the query.
  const runSearch = useCallback(
    async (text) => {
      const seq = ++searchSeqRef.current;
      if (!text.trim() || !pdfDoc) {
        setMatches([]);
        setCurrentIndex(-1);
        return;
      }

      setSearching(true);
      const results = [];
      const needle = text.toLowerCase();

      try {
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (seq !== searchSeqRef.current) return; // stale search
          // If the document's worker was destroyed mid-search (e.g. the user
          // switched tabs/files), pdf.js methods throw "Worker was destroyed" /
          // "Worker task was terminated". Bail out cleanly instead.
          if (!pdfDoc || !pdfDoc.getPage) return;
          const page = await pdfDoc.getPage(pageNum);
          if (!page || !page.getTextContent) continue;
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item) => (typeof item.str === "string" ? item.str : ""))
            .join(" ");

          let idx = pageText.toLowerCase().indexOf(needle);
          while (idx !== -1) {
            results.push({ page: pageNum, index: idx, text: pageText.slice(idx, idx + needle.length) });
            idx = pageText.toLowerCase().indexOf(needle, idx + needle.length);
          }
        }

        if (seq !== searchSeqRef.current) return;
        setMatches(results);
        setCurrentIndex(results.length > 0 ? 0 : -1);
        if (results.length > 0) {
          onJumpToPage(results[0].page);
        }
      } catch {
        // Search failed — clear results.
        if (seq === searchSeqRef.current) {
          setMatches([]);
          setCurrentIndex(-1);
        }
      } finally {
        if (seq === searchSeqRef.current) {
          setSearching(false);
        }
      }
    },
    [pdfDoc, onJumpToPage]
  );

  // Debounced search as the user types.
  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const goToMatch = useCallback(
    (index) => {
      if (index < 0 || index >= matches.length) return;
      setCurrentIndex(index);
      onJumpToPage(matches[index].page);
    },
    [matches, onJumpToPage]
  );

  const handleNext = useCallback(() => {
    if (matches.length === 0) return;
    goToMatch((currentIndex + 1) % matches.length);
  }, [matches, currentIndex, goToMatch]);

  const handlePrev = useCallback(() => {
    if (matches.length === 0) return;
    goToMatch((currentIndex - 1 + matches.length) % matches.length);
  }, [matches, currentIndex, goToMatch]);

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--bg)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      <input
        ref={inputRef}
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) handlePrev();
            else handleNext();
          }
          if (e.key === "Escape") onClose?.();
        }}
        placeholder="Search in document…"
        style={{
          border: "none",
          background: "none",
          color: "var(--text-h)",
          fontSize: 13,
          width: 180,
          outline: "none",
        }}
      />
      <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
        {searching ? "…" : matches.length > 0 ? `${currentIndex + 1} / ${matches.length}` : query ? "0" : ""}
      </span>
      <button
        onClick={handlePrev}
        disabled={matches.length === 0}
        aria-label="Previous match"
        style={{
          border: "none",
          background: "none",
          color: "var(--text)",
          cursor: matches.length > 0 ? "pointer" : "default",
          opacity: matches.length > 0 ? 1 : 0.4,
          display: "flex",
          alignItems: "center",
          padding: 2,
        }}
      >
        <ChevronLeftIcon size={16} />
      </button>
      <button
        onClick={handleNext}
        disabled={matches.length === 0}
        aria-label="Next match"
        style={{
          border: "none",
          background: "none",
          color: "var(--text)",
          cursor: matches.length > 0 ? "pointer" : "default",
          opacity: matches.length > 0 ? 1 : 0.4,
          display: "flex",
          alignItems: "center",
          padding: 2,
        }}
      >
        <ChevronRightIcon size={16} />
      </button>
      <button
        onClick={onClose}
        aria-label="Close search"
        style={{
          border: "none",
          background: "none",
          color: "var(--text)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: 2,
        }}
      >
        <XIcon size={16} />
      </button>
    </div>
  );
}