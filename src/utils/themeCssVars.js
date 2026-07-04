import { hexToRgb } from "./formatters.js";
import { ACCENT_HOVER } from "./constants.js";

// Derives chrome CSS variables from the resolved UI theme's base colors,
// reusing the variable names already defined in index.css so existing rules
// (h1/h2, code, etc.) automatically re-skin. Shared by the reader Shell and
// the landing page so both respect the same light/dark/system choice.
export function themeToCssVars(resolvedTheme) {
  const fg = hexToRgb(resolvedTheme.fg);
  return {
    "--bg": resolvedTheme.bg,
    "--text": `rgba(${fg.r}, ${fg.g}, ${fg.b}, 0.75)`,
    "--text-h": resolvedTheme.fg,
    "--border": `rgba(${fg.r}, ${fg.g}, ${fg.b}, 0.14)`,
    "--code-bg": `rgba(${fg.r}, ${fg.g}, ${fg.b}, 0.06)`,
    "--accent": resolvedTheme.accent,
    "--accent-hover": ACCENT_HOVER,
    "--accent-bg": `${resolvedTheme.accent}26`,
    "--accent-border": `${resolvedTheme.accent}80`,
  };
}
