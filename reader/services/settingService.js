import * as storageService from "./storageService.js";
import { DEFAULT_UI_THEME_ID, DEFAULT_PDF_COLOR_MODE_ID } from "../utils/constants.js";

const UI_THEME_KEY = "ui-theme";
const PDF_COLOR_MODE_KEY = "pdf-color-mode";
const RECENT_VIEW_KEY = "recent-view";

export function getUiTheme() {
  return storageService.get(UI_THEME_KEY, DEFAULT_UI_THEME_ID);
}

export function setUiTheme(id) {
  storageService.set(UI_THEME_KEY, id);
}

export function getPdfColorMode() {
  return storageService.get(PDF_COLOR_MODE_KEY, DEFAULT_PDF_COLOR_MODE_ID);
}

export function setPdfColorMode(id) {
  storageService.set(PDF_COLOR_MODE_KEY, id);
}

// Recent files view preference: "grid" (thumbnails) or "list".
export function getRecentView() {
  return storageService.get(RECENT_VIEW_KEY, "grid");
}

export function setRecentView(view) {
  storageService.set(RECENT_VIEW_KEY, view);
}
