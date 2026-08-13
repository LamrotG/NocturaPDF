import { useCallback, useEffect, useRef } from "react";
import { createDebouncedPositionSaver } from "../persistence/readingPosition.js";

/**
 * Wires reading-position persistence to a document/reader.
 *
 * The returned `savePosition` function is debounced (default 800 ms) and
 * should be called from scroll/page/zoom/rotation change handlers.
 * `flushNow` is available for lifecycle events (tab switch, close, unload).
 */
export function useReadingPosition({ documentId, enabled = true }) {
  const saverRef = useRef(null);

  if (saverRef.current == null) {
    saverRef.current = createDebouncedPositionSaver();
  }

  // Flush on unmount / document change so the last position isn't lost.
  useEffect(() => {
    const saver = saverRef.current;
    return () => {
      saver.flushNow();
    };
  }, []);

  const savePosition = useCallback(
    (position) => {
      if (!enabled || !documentId) return;
      saverRef.current.schedule(documentId, position);
    },
    [enabled, documentId]
  );

  const flushNow = useCallback(() => {
    if (!enabled || !documentId) return Promise.resolve();
    return saverRef.current.flushNow();
  }, [enabled, documentId]);

  return { savePosition, flushNow };
}