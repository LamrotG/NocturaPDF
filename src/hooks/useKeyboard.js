import { useEffect } from "react";

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

// Global reading-mode keyboard shortcuts. Ctrl+scroll zoom is intentionally
// NOT here — it needs the scroll viewport's own DOM node and lives in
// ScrollContainer.jsx as a wheel listener instead.
export function useKeyboard({
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onToggleFocusMode,
  onOpenSearch,
  onEscape,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (isTypingTarget(document.activeElement)) {
        // Only Escape still fires while a field is focused, so an input
        // (page number, search box) can be dismissed without the rest of
        // the shortcut set stealing keystrokes meant for typing.
        if (e.key === "Escape") onEscape?.();
        return;
      }

      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (ctrlOrCmd && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        onZoomIn?.();
      } else if (ctrlOrCmd && e.key === "-") {
        e.preventDefault();
        onZoomOut?.();
      } else if (ctrlOrCmd && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onOpenSearch?.();
      } else if (!ctrlOrCmd && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onToggleFocusMode?.();
      } else if (e.key === "Escape") {
        onEscape?.();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        onNextPage?.();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        onPrevPage?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrevPage, onNextPage, onZoomIn, onZoomOut, onToggleFocusMode, onOpenSearch, onEscape]);
}
