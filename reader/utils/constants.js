export const UI_THEMES = {
  light: { id: "light", label: "Light", bg: "#ffffff", fg: "#08060d", accent: "#195E63" },
  dark: { id: "dark", label: "Dark", bg: "#16171d", fg: "#f3f4f6", accent: "#195E63" },
};

// A lightened tint of the brand color, used for hover states (accessed via
// the --accent-hover CSS var — see themeCssVars.js).
export const ACCENT_HOVER = "#1F7A81";

export const UI_THEME_ORDER = ["light", "dark", "system"];

export const DEFAULT_UI_THEME_ID = "system";

// bg/fg here are the LUT's recolor target for PDF page pixels (what white
// paper / black text map to) — unrelated to UI_THEMES' chrome colors, even
// though some values happen to coincide.
export const PDF_COLOR_MODES = {
  off: { id: "off", label: "Original", summary: "Exact document appearance", detail: "Shows the PDF exactly as it was created, without changing its colors or appearance. Best when you want the original document." },
  native: { id: "native", label: "Native", bg: "#181b21", fg: "#e8eaed", mode: "native", summary: "Natural PDF rendering", detail: "A simple reading mode that keeps the document's original colors and appearance while using PDF.js's standard rendering." },
  smart: { id: "smart", label: "Smart", bg: "#1b1e24", fg: "#e8eaed", mode: "preserve", renderer: "cpu", summary: "Best for everyday reading", detail: "Automatically chooses a suitable reading approach for different types of PDFs. A good choice for most documents." },
  pureBlack: { id: "pureBlack", label: "Pure Black", bg: "#000000", fg: "#f5f7fa", mode: "aggressive", renderer: "webgl", summary: "Best for OLED screens", detail: "Uses a true-black background to make reading more comfortable in dark environments and reduce light from OLED screens." },
  gpuDark: { id: "gpuDark", label: "GPU Dark", bg: "#10151f", fg: "#e6edf7", mode: "preserve", renderer: "webgl", summary: "Dark mode with natural colors", detail: "Darkens the page while trying to preserve the original colors of images, illustrations, and other content." },
  scan: { id: "scan", label: "Scan Dark", bg: "#15181d", fg: "#edf0f3", mode: "scan", renderer: "cpu", summary: "Best for scanned documents", detail: "Designed for scanned PDFs, such as documents made from photos or screenshots. Darkens the page and improves contrast to make scanned text easier to read." },
  preserve: { id: "preserve", label: "Preserve", bg: "#171a20", fg: "#dce5ef", mode: "overlay", renderer: "overlay", summary: "Best for image-heavy PDFs", detail: "A gentle dark mode that keeps photos, illustrations, and other visual content closer to their original appearance." },
};

// Theme order: Original, Native, Smart, then other dark/alternative themes.
export const PDF_COLOR_MODE_ORDER = ["off", "native", "smart", "pureBlack", "gpuDark", "scan", "preserve"];

export const DEFAULT_PDF_COLOR_MODE_ID = "off";

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 0.1;

// How many pages beyond the visible viewport stay mounted/rendered.
export const VIRTUALIZATION_BUFFER_PAGES = 2;