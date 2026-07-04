import * as storageService from "./storageService.js";
import { DEFAULT_UI_THEME_ID, DEFAULT_PDF_COLOR_MODE_ID } from "../utils/constants.js";

const UI_THEME_KEY = "ui-theme";
const PDF_COLOR_MODE_KEY = "pdf-color-mode";
const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

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

// Sidebar defaults to collapsed per the reading-first layout — it is
// optional context, never the default reading surface.
export function getSidebarCollapsed() {
  return storageService.get(SIDEBAR_COLLAPSED_KEY, true);
}

export function setSidebarCollapsed(collapsed) {
  storageService.set(SIDEBAR_COLLAPSED_KEY, collapsed);
}
