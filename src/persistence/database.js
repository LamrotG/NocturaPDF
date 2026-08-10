/**
 * NocturaPDF IndexedDB persistence layer.
 *
 * Single source of truth for all persistent document/reader state.
 * Schema notes:
 *   - "documents"   → one record per unique PDF (stable identity, not filename)
 *   - "annotations" → highlights/notes tied to a document + page
 *   - "metadata"    → app-level key/value state (preserved from v1)
 *   - "library"     → Local Library index (preserved from v1)
 */
const DB_NAME = "nocturapdf";
const DB_VERSION = 2;

let dbPromise = null;

export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // ── v1 stores (preserved for backward compatibility) ─────────────
      if (!db.objectStoreNames.contains("metadata")) {
        const store = db.createObjectStore("metadata", { keyPath: "key" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains("library")) {
        const store = db.createObjectStore("library", { keyPath: "key" });
        store.createIndex("addedAt", "addedAt");
      }

      // ── v2 stores ─────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains("documents")) {
        const store = db.createObjectStore("documents", { keyPath: "id" });
        store.createIndex("fingerprint", "fingerprint", { unique: false });
        store.createIndex("lastOpened", "lastOpened");
        store.createIndex("libraryType", "libraryType");
      }
      if (!db.objectStoreNames.contains("annotations")) {
        const store = db.createObjectStore("annotations", { keyPath: "id" });
        store.createIndex("documentId", "documentId");
        store.createIndex("page", "page");
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

/**
 * Run a transaction on a single object store.
 */
export function tx(storeName, mode, fn) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const result = fn(store);
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

export async function getOne(storeName, key) {
  return tx(storeName, "readonly", (store) => store.get(key));
}

export async function putOne(storeName, value) {
  return tx(storeName, "readwrite", (store) => store.put(value));
}

export async function deleteOne(storeName, key) {
  return tx(storeName, "readwrite", (store) => store.delete(key));
}

export async function getAll(storeName) {
  return tx(storeName, "readonly", (store) => store.getAll());
}

/**
 * Get all records from a store sorted by an index (descending).
 */
export async function getAllByIndex(storeName, indexName, direction = "next") {
  return tx(storeName, "readonly", (store) => {
    const index = store.index(indexName);
    const req = index.getAll(null, undefined, direction);
    return req;
  });
}