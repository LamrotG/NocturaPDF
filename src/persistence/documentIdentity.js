/**
 * Robust PDF document identification.
 *
 * A PDF is never identified by filename alone — two different PDFs can
 * share a name. Instead we build a stable local identity from:
 *
 *   documentId = pdf.js fingerprint + file metadata + local persistent UUID
 *
 * If pdf.js exposes a fingerprint we use it as the primary discriminator;
 * otherwise we fall back to a content hash (SHA-256 of the first N bytes)
 * combined with file size and lastModified.
 */
import { openDatabase, tx } from "./database.js";

const FALLBACK_HASH_BYTES = 64 * 1024; // first 64 KiB is enough to disambiguate

function uuid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function sha256Hex(data) {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive a stable fingerprint key for a file + pdf.js document.
 * Prefers the pdf.js fingerprint (the most robust signal), falling back to
 * a content hash when unavailable.
 */
export async function deriveFingerprint(file, pdfDoc) {
  // pdf.js exposes a fingerprint on modern versions.
  const pdfFingerprint = pdfDoc?.fingerprints?.[0];
  if (pdfFingerprint) return `pdfjs:${pdfFingerprint}`;

  // Fallback: hash the first 64 KiB of the file + size for stability.
  try {
    const bytes = new Uint8Array(await file.slice(0, FALLBACK_HASH_BYTES).arrayBuffer());
    const hash = await sha256Hex(bytes);
    return `sha256:${hash}:${file.size || 0}`;
  } catch {
    // Last resort: if we can't hash, use metadata alone (weakest signal).
    return `meta:${file.name}:${file.size || 0}:${file.lastModified || 0}`;
  }
}

/**
 * Resolve the persistent document record for a file + pdf.js document.
 *
 * Returns the existing record if one already exists for this fingerprint,
 * or creates a fresh record with a new local UUID.
 */
export async function resolveDocumentRecord(file, pdfDoc) {
  const fingerprint = await deriveFingerprint(file, pdfDoc);

  // 1. Try to find an existing record by fingerprint.
  const existing = await findDocumentByFingerprint(fingerprint);
  if (existing) {
    // Keep filename fresh but preserve identity.
    return {
      ...existing,
      filename: file.name || existing.filename,
      fileSize: file.size ?? existing.fileSize ?? 0,
      lastModified: file.lastModified ?? existing.lastModified ?? 0,
      fingerprint,
    };
  }

  // 2. No existing record — create a new identity.
  const now = Date.now();
  const doc = {
    id: uuid(),
    fingerprint,
    filename: file.name || "document.pdf",
    fileSize: file.size || 0,
    lastModified: file.lastModified || 0,
    createdAt: now,
    lastOpened: now,
    lastPage: 1,
    readingPosition: null,
    libraryType: null, // null | "local" | "cloud"
    cloudId: null,
  };
  return doc;
}

async function findDocumentByFingerprint(fingerprint) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const t = db.transaction("documents", "readonly");
    const store = t.objectStore("documents");
    const index = store.index("fingerprint");
    const req = index.getAll(fingerprint);
    req.onsuccess = () => resolve(req.result?.[0] || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Convenience wrapper for the full "open a PDF" flow:
 * resolve identity + update lastOpened.
 * Persisted by the caller via documentRepository.
 */
export { tx };