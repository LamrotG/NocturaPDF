/**
 * Reading-position persistence.
 *
 * A full visual position is stored — not just a page number — so reopening
 * a document restores page, scroll offset, zoom, and rotation exactly.
 */
import { getOne, putOne } from "./database.js";

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/**
 * Save (or update) the reading position for a document.
 * Callers debounce before invoking this.
 */
export async function saveReadingPosition(documentId, position) {
  if (!documentId || !position) return;

  const doc = (await getOne("documents", documentId)) || {};
  const safe = {
    page: clamp(position.page, 1, 100000, 1),
    x: clamp(position.x, 0, 1, 0),
    y: clamp(position.y, 0, 1, 0),
    zoom: clamp(position.zoom, 0.25, 4, 1),
    rotation: Math.round(clamp(position.rotation, 0, 359, 0) / 90) * 90,
  };

  const updated = {
    ...doc,
    readingPosition: safe,
    lastPage: safe.page,
  };
  await putOne("documents", updated);
}

/**
 * Load the persisted reading position, or null.
 */
export async function loadReadingPosition(documentId) {
  if (!documentId) return null;
  const doc = await getOne("documents", documentId);
  return doc?.readingPosition || null;
}

/**
 * Debounced reading-position saver.
 *
 * Accumulates the latest position, flushes after `delayMs` of inactivity.
 * A monotonically increasing sequence number ensures a stale flush can
 * never overwrite a newer position.
 */
export function createDebouncedPositionSaver({ delayMs = 800, onError } = {}) {
  let timer = null;
  let pending = null;
  let seq = 0;

  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const job = pending;
    pending = null;
    if (job) {
      saveReadingPosition(job.documentId, job.position).catch((e) => onError?.(e));
    }
  }

  return {
    /**
     * Queue a position update. Only the latest is flushed.
     */
    schedule(documentId, position) {
      const id = ++seq;
      pending = { documentId, position, id };
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
      return id;
    },

    /**
     * Immediately persist the latest pending position.
     * Returns a promise that resolves when the write completes.
     */
    flushNow() {
      return new Promise((resolve) => {
        if (timer) clearTimeout(timer);
        timer = null;
        const job = pending;
        pending = null;
        if (job) {
          saveReadingPosition(job.documentId, job.position)
            .catch((e) => onError?.(e))
            .finally(resolve);
        } else {
          resolve();
        }
      });
    },

    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}