import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_UI_THEME_ID, UI_THEME_ORDER, UI_THEMES } from "../utils/constants.js";
import { getUiTheme, setUiTheme } from "../services/settingService.js";

const UiThemeContext = createContext(null);

function useSystemPrefersDark() {
  const [prefersDark, setPrefersDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setPrefersDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersDark;
}

// Drives UI chrome only (backgrounds, toolbars, sidebar, panels) — never the
// PDF rendering layer. See usePdfColorMode.js for that separate concern.
// Plain .js (no JSX) so this file stays usable without a Vite JSX-loader
// override for non-.jsx files — createElement is equivalent here.
export function UiThemeProvider({ children }) {
  const [uiThemeId, setUiThemeIdState] = useState(() => getUiTheme());
  const prefersDark = useSystemPrefersDark();

  const setUiThemeId = useCallback((id) => {
    setUiThemeIdState(id);
    setUiTheme(id);
  }, []);

  const resolvedId = uiThemeId === "system" ? (prefersDark ? "dark" : "light") : uiThemeId;
  const resolvedTheme = UI_THEMES[resolvedId] || UI_THEMES[DEFAULT_UI_THEME_ID] || UI_THEMES.light;
  const uiThemes = useMemo(() => UI_THEME_ORDER, []);

  const value = useMemo(
    () => ({ uiThemeId, resolvedThemeId: resolvedId, resolvedTheme, setUiThemeId, uiThemes }),
    [uiThemeId, resolvedId, resolvedTheme, setUiThemeId, uiThemes]
  );

  return React.createElement(UiThemeContext.Provider, { value }, children);
}

export function useUiTheme() {
  const ctx = useContext(UiThemeContext);
  if (!ctx) {
    throw new Error("useUiTheme must be used within a UiThemeProvider");
  }
  return ctx;
}
