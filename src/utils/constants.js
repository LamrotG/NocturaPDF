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
  off: { id: "off", label: "Original" },
  smart: { id: "smart", label: "Smart", bg: "#1b1e24", fg: "#e8eaed", mode: "preserve", renderer: "cpu", summary: "Balanced for most PDFs", detail: "Document-aware default: preserves text and images, uses CPU/WebGL/Native as appropriate." },
  pureBlack: { id: "pureBlack", label: "Pure Black", bg: "#000000", fg: "#f5f7fa", mode: "aggressive", renderer: "webgl", summary: "True black OLED mode", detail: "GPU-based deep-black rendering that prioritizes text clarity and OLED-friendly blacks." },
  gpuDark: { id: "gpuDark", label: "GPU Dark", bg: "#10151f", fg: "#e6edf7", mode: "preserve", renderer: "webgl", summary: "GPU-accelerated color-preserving darkening", detail: "Uses WebGL + LUT to retain colour fidelity while darkening pages smoothly." },
  native: { id: "native", label: "Native Render", bg: "#181b21", fg: "#e8eaed", mode: "native", summary: "PDF.js native colour transform", detail: "Applied at render time for sharpest text and vector quality where supported." },
  scan: { id: "scan", label: "Scan Dark", bg: "#15181d", fg: "#edf0f3", mode: "scan", renderer: "cpu", summary: "For scanned or aged pages", detail: "Grayscale tone-mapping tailored for scanned documents to improve contrast and reduce paper noise." },
  preserve: { id: "preserve", label: "Preserve", bg: "#171a20", fg: "#dce5ef", mode: "overlay", renderer: "overlay", summary: "Gentle preservation mode", detail: "Applies a dark overlay and subtle brightness reduction to keep photos and illustrations intact." },
};

// Remove deprecated/less-relevant CPU-only themes 'pure' and 'sepia' by
// ensuring they are not present in the mode list. Keep a compact, ordered
// list of available reader color modes exposed to the user.
export const PDF_COLOR_MODE_ORDER = ["off", "smart", "pureBlack", "gpuDark", "native", "scan", "preserve"];

export const DEFAULT_PDF_COLOR_MODE_ID = "off";

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 0.1;

// How many pages beyond the visible viewport stay mounted/rendered.
export const VIRTUALIZATION_BUFFER_PAGES = 2;
