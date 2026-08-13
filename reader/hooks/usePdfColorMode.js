import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { DEFAULT_PDF_COLOR_MODE_ID, PDF_COLOR_MODE_ORDER, PDF_COLOR_MODES } from "../utils/constants.js";
import { getThemeLut } from "../features/darkmode/darkmodeEngine.js";
import { getPdfColorMode, setPdfColorMode } from "../services/settingService.js";

const PdfColorModeContext = createContext(null);

// Drives PDF content recoloring only — completely decoupled from the UI
// chrome theme (useUiTheme.js). Defaults to "off" so the reading surface is
// pristine unless the user opts in.
// Plain .js (no JSX) so this file stays usable without a Vite JSX-loader
// override for non-.jsx files — createElement is equivalent here.
export function PdfColorModeProvider({ children }) {
  const [colorModeId, setColorModeIdState] = useState(() => getPdfColorMode());

  const setColorModeId = useCallback((id) => {
    setColorModeIdState(id);
    setPdfColorMode(id);
  }, []);

  const colorMode = PDF_COLOR_MODES[colorModeId] || PDF_COLOR_MODES[DEFAULT_PDF_COLOR_MODE_ID];
  const lut = useMemo(() => getThemeLut(colorMode), [colorMode]);
  const colorModes = useMemo(() => PDF_COLOR_MODE_ORDER.map((id) => PDF_COLOR_MODES[id]), []);

  const value = useMemo(
    () => ({ colorModeId, setColorModeId, colorMode, lut, colorModes }),
    [colorModeId, setColorModeId, colorMode, lut, colorModes]
  );

  return React.createElement(PdfColorModeContext.Provider, { value }, children);
}

export function usePdfColorMode() {
  const ctx = useContext(PdfColorModeContext);
  if (!ctx) {
    throw new Error("usePdfColorMode must be used within a PdfColorModeProvider");
  }
  return ctx;
}
