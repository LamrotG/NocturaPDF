/**
 * Annotation repository — highlights and notes tied to a document + page.
 */
import { tx, getOne, putOne, getAll } from "./database.js";

function uuid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `ann-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Create a highlight annotation.
 */
export async function createHighlight({ documentId, page, text, rects, color = "#f7e06b" }) {
  const now = Date.now();
  const ann = {
    id: uuid(),
    type: "highlight",
    documentId,
    page,
    text,
    rects: rects || [],
    color,
    note: "",
    createdAt: now,
    updatedAt: now,
  };
  await putOne("annotations", ann);
  return ann;
}

/**
 * Create a note annotation associated with text/location.
 */
export async function createBookmark({ documentId, page, label = "" }) {
  const now = Date.now();
  const ann = {
    id: uuid(),
    type: "bookmark",
    documentId,
    page,
    text: label || "",
    rects: [],
    color: "#f7e06b",
    note: "",
    createdAt: now,
    updatedAt: now,
  };
  await putOne("annotations", ann);
  return ann;
}

export async function createNote({ documentId, page, text, note, rects = [] }) {
  const now = Date.now();
  const ann = {
    id: uuid(),
    type: "note",
    documentId,
    page,
    text: text || "",
    rects,
    color: "#7aa2f7",
    note: note || "",
    createdAt: now,
    updatedAt: now,
  };
  await putOne("annotations", ann);
  return ann;
}

export async function updateAnnotation(id, patch) {
  const existing = (await getOne("annotations", id)) || null;
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: Date.now() };
  await putOne("annotations", updated);
  return updated;
}

export async function deleteAnnotation(id) {
  return tx("annotations", "readwrite", (store) => store.delete(id));
}

/**
 * All annotations for a document.
 */
export async function getDocumentAnnotations(documentId) {
  const all = await getAll("annotations");
  return all.filter((a) => a.documentId === documentId);
}

/**
 * Annotations for a specific page of a document.
 */
export async function getPageAnnotations(documentId, page) {
  const all = await getDocumentAnnotations(documentId);
  return all.filter((a) => a.page === page);
}