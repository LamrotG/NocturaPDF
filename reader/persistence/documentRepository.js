/**
 * Document repository — the only module that reads/writes the "documents"
 * object store. Components never touch IndexedDB directly for document
 * state.
 */
import { openDatabase, tx, getOne, putOne, getAll } from "./database.js";
import { resolveDocumentRecord } from "./documentIdentity.js";

export const LIBRARY_TYPE = {
  LOCAL: "local",
  CLOUD: "cloud",
};

export async function getDocument(id) {
  return getOne("documents", id);
}

export async function upsertDocument(doc) {
  return putOne("documents", doc);
}

export async function deleteDocument(id) {
  return tx("documents", "readwrite", (store) => store.delete(id));
}

export async function getAllDocuments() {
  const docs = await getAll("documents");
  return docs.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
}

/**
 * Get documents ordered by lastOpened descending (Recent list).
 */
export async function getRecentDocuments(limit = 50) {
  const all = await getAllDocuments();
  return all.filter((d) => d.lastOpened).slice(0, limit);
}

/**
 * Get documents marked as Local Library.
 */
export async function getLocalLibraryDocuments() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const t = db.transaction("documents", "readonly");
    const store = t.objectStore("documents");
    const index = store.index("libraryType");
    const req = index.getAll(LIBRARY_TYPE.LOCAL);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get documents marked as Cloud Library.
 */
export async function getCloudLibraryDocuments() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const t = db.transaction("documents", "readonly");
    const store = t.objectStore("documents");
    const index = store.index("libraryType");
    const req = index.getAll(LIBRARY_TYPE.CLOUD);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Mark a document as belonging to the Local Library.
 * Also persists the binary to OPFS if a File/Blob is provided.
 */
export async function addToLocalLibrary(record, fileBytes) {
  const updated = {
    ...record,
    libraryType: LIBRARY_TYPE.LOCAL,
  };

  // If we have binary data and OPFS is available, persist the file so it
  // remains available offline after browser restart.
  if (fileBytes) {
    try {
      const { saveLocalPdf } = await import("../services/opfsService.js");
      const { key } = await saveLocalPdf(fileBytes);
      updated.localKey = key;
    } catch {
      // OPFS unavailable — metadata-only entry; reopening will require re-pick.
    }
  }

  await upsertDocument(updated);
  return updated;
}

/**
 * Remove a document from the Local Library (metadata + OPFS binary).
 */
export async function removeFromLocalLibrary(id) {
  const doc = await getDocument(id);
  if (!doc) return;

  if (doc.localKey) {
    try {
      const { deleteLocalPdf } = await import("../services/opfsService.js");
      await deleteLocalPdf(doc.localKey);
    } catch {
      // ignore — best-effort binary cleanup
    }
  }

  const updated = { ...doc, libraryType: null, localKey: null };
  await upsertDocument(updated);
  return updated;
}

/**
 * Open + record a document: resolves identity, bumps lastOpened, persists.
 * Also mirrors the binary into OPFS when possible so the document can be
 * reopened from Recents without the original File handle (a browser File
 * object dies with the page). OPFS paths are content-hash keyed, so this is
 * deduped: once localKey exists the same bytes are already stored.
 */
export async function recordDocumentOpen(file, pdfDoc) {
  const record = await resolveDocumentRecord(file, pdfDoc);
  const now = Date.now();

  // Preserve libraryType from the existing record.
  const updated = {
    ...record,
    filename: file.name || record.filename,
    fileSize: file.size ?? record.fileSize ?? 0,
    lastModified: file.lastModified ?? record.lastModified ?? 0,
    lastOpened: now,
  };

  // Mirror the binary into OPFS so "Recents" can reopen the actual document
  // later — but OFF the open path's critical path: a full-file read + SHA-256
  // here would stall opening by seconds on large PDFs. Fire-and-forget: the
  // record is written first without localKey, then patched once the copy
  // lands (re-read to preserve any concurrent fields like readingPosition).
  if (!updated.localKey) {
    (async () => {
      try {
        const { saveLocalPdf } = await import("../services/opfsService.js");
        const { key } = await saveLocalPdf(file);
        const stored = await getOne("documents", updated.id);
        await putOne("documents", { ...(stored || updated), localKey: key });
      } catch {
        // OPFS unavailable — metadata-only entry; reopening will fall back
        // to the file picker.
      }
    })();
  }

  await upsertDocument(updated);
  return updated;
}

/**
 * Clear the Recents list without destroying user data: drops lastOpened so
 * documents leave Recents (which filters on it) while keeping reading
 * positions, library membership, and metadata intact.
 */
export async function clearRecentHistory() {
  const all = await getAllDocuments();
  await Promise.all(all.map((doc) => upsertDocument({ ...doc, lastOpened: null })));
}