/**
 * IndexedDB-backed metadata store.
 *
 * Stores reading metadata (last page, bookmarks, preferences) and the
 * Local Library index. IndexedDB is used instead of localStorage because
 * it can hold structured data (JSONB-like objects) and is the standard
 * place for app metadata in a PWA.
 *
 * Stores:
 *   - "metadata"  → { key, lastPage, numPages, bookmarks, preferences, updatedAt }
 *   - "library"   → { key, name, size, addedAt }  (Local Library index)
 */

const DB_NAME = "nocturapdf";
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("metadata")) {
        const store = db.createObjectStore("metadata", { keyPath: "key" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains("library")) {
        const store = db.createObjectStore("library", { keyPath: "key" });
        store.createIndex("addedAt", "addedAt");
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

function tx(storeName, mode, fn) {
  return openDb().then(
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

// ── Metadata ────────────────────────────────────────────────────────────────

export async function getMetadata(key) {
  return tx("metadata", "readonly", (store) => store.get(key));
}

export async function setMetadata(key, data) {
  const record = {
    key,
    lastPage: data.lastPage ?? 1,
    numPages: data.numPages ?? 0,
    bookmarks: data.bookmarks ?? [],
    preferences: data.preferences ?? {},
    updatedAt: Date.now(),
  };
  return tx("metadata", "readwrite", (store) => store.put(record));
}

export async function deleteMetadata(key) {
  return tx("metadata", "readwrite", (store) => store.delete(key));
}

export async function getAllMetadata() {
  return tx("metadata", "readonly", (store) => store.getAll());
}

// ── Local Library index ─────────────────────────────────────────────────────

export async function addLibraryEntry(entry) {
  const record = {
    key: entry.key,
    name: entry.name,
    size: entry.size,
    addedAt: Date.now(),
  };
  return tx("library", "readwrite", (store) => store.put(record));
}

export async function removeLibraryEntry(key) {
  return tx("library", "readwrite", (store) => store.delete(key));
}

export async function getLibraryEntries() {
  return tx("library", "readonly", (store) => store.getAll());
}

export async function getLibraryEntry(key) {
  return tx("library", "readonly", (store) => store.get(key));
}