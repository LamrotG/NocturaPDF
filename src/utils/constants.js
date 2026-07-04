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
  off: { id: "off", label: "Off" },
  smart: { id: "smart", label: "Smart", bg: "#1b1e24", fg: "#e8eaed", mode: "preserve" },
  pure: { id: "pure", label: "Pure", bg: "#0a0a0a", fg: "#f5f5f5", mode: "aggressive" },
  sepia: { id: "sepia", label: "Sepia", bg: "#1f1a15", fg: "#e0d2b8", mode: "warm" },
};

export const PDF_COLOR_MODE_ORDER = ["off", "smart", "pure", "sepia"];

export const DEFAULT_PDF_COLOR_MODE_ID = "off";

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 0.1;

// How many pages beyond the visible viewport stay mounted/rendered.
export const VIRTUALIZATION_BUFFER_PAGES = 2;
