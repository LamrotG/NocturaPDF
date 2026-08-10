/**
 * Persistence layer public API.
 * Components import from here instead of reaching into IndexedDB directly.
 */
export { openDatabase } from "./database.js";
export {
  getDocument,
  upsertDocument,
  deleteDocument,
  getAllDocuments,
  getRecentDocuments,
  getLocalLibraryDocuments,
  getCloudLibraryDocuments,
  addToLocalLibrary,
  removeFromLocalLibrary,
  recordDocumentOpen,
  LIBRARY_TYPE,
} from "./documentRepository.js";
export { deriveFingerprint, resolveDocumentRecord } from "./documentIdentity.js";
export {
  saveReadingPosition,
  loadReadingPosition,
  createDebouncedPositionSaver,
} from "./readingPosition.js";
export {
  createHighlight,
  createNote,
  updateAnnotation,
  deleteAnnotation,
  getDocumentAnnotations,
  getPageAnnotations,
} from "./annotationRepository.js";