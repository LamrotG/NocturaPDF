import * as storage from "./storageService.js";

const RECENT_FILES_KEY = "recentFiles";
const MAX_RECENT_FILES = 10;

/**
 * @typedef {Object} RecentFile
 * @property {string} id - Unique identifier
 * @property {string} name - File name
 * @property {number} size - File size in bytes
 * @property {string} thumbnail - Base64 data URL
 * @property {number} openedAt - Timestamp when file was opened
 * @property {string} [filePath] - Optional file path (for Electron/desktop)
 */

/**
 * Add or update a file in the recent files list
 * Automatically maintains the max limit and removes duplicates
 * @param {File} file - The file object
 * @param {string} thumbnail - Base64 thumbnail data URL
 * @param {string} [filePath] - Optional file path for desktop apps
 */
export function addRecentFile(file, thumbnail, filePath) {
  try {
    const recentFiles = getRecentFiles();
    
    // Remove if already exists (to avoid duplicates and move to top)
    const filtered = recentFiles.filter(f => f.name !== file.name);
    
    // Create new entry
    const newEntry = {
      id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size || 0,
      thumbnail: thumbnail || "", // base64 data URL
      openedAt: Date.now(),
    };

    // Add file path if provided (for Electron/desktop)
    if (filePath) {
      newEntry.filePath = filePath;
    }
    
    // Add to beginning and limit to MAX_RECENT_FILES
    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_FILES);
    
    storage.set(RECENT_FILES_KEY, updated);
    return updated;
  } catch (e) {
    console.error("Error adding recent file:", e);
    return getRecentFiles();
  }
}

/**
 * Get all recent files
 */
export function getRecentFiles() {
  return storage.get(RECENT_FILES_KEY, []);
}

/**
 * Clear all recent files
 */
export function clearRecentFiles() {
  storage.set(RECENT_FILES_KEY, []);
}

/**
 * Remove a specific recent file by id
 */
export function removeRecentFile(fileId) {
  try {
    const recentFiles = getRecentFiles();
    const updated = recentFiles.filter(f => f.id !== fileId);
    storage.set(RECENT_FILES_KEY, updated);
    return updated;
  } catch (e) {
    console.error("Error removing recent file:", e);
    return getRecentFiles();
  }
}
