import React, { useState } from "react";
import IconButton from "../common/IconButton.jsx";
import { MAX_SCALE, MIN_SCALE, ZOOM_STEP } from "../../utils/constants.js";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FitPageIcon,
  FitWidthIcon,
  SearchIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "../common/icons.jsx";

// Thin, utility-only bar directly below the tab strip: page nav, zoom, fit
// mode, search entry, PDF theme selector. No branding.
export default function SecondaryToolbar({
  currentPage,
  numPages,
  onJumpToPage,
  zoomFactor,
  onZoomChange,
  fitMode,
  onFitModeChange,
  onOpenSearch,
  colorModes,
  colorModeId,
  onColorModeChange,
}) {
  const [pageInput, setPageInput] = useState("");
  const [themeOpen, setThemeOpen] = useState(false);

  const zoomIn = () => {
    onFitModeChange("custom");
    onZoomChange(Math.min(MAX_SCALE, +(zoomFactor + ZOOM_STEP).toFixed(2)));
  };
  const zoomOut = () => {
    onFitModeChange("custom");
    onZoomChange(Math.max(MIN_SCALE, +(zoomFactor - ZOOM_STEP).toFixed(2)));
  };
  const zoomReset = () => {
    onFitModeChange("width");
    onZoomChange(1);
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const value = Number(pageInput);
    if (!value || value < 1 || value > numPages) return;
    onJumpToPage(value);
    setPageInput("");
  };

  const hasDoc = numPages > 0;
  const currentMode = colorModes.find((m) => m.id === colorModeId) || colorModes[0];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        color: "var(--text-h)",
        flexWrap: "wrap",
      }}
    >
      {hasDoc && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconButton
              aria-label="Previous page"
              onClick={() => onJumpToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon />
            </IconButton>
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageInput || currentPage || 1}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              style={{
                width: 48,
                padding: "4px 6px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text-h)",
                fontSize: 13,
              }}
            />
            <span style={{ opacity: 0.7, fontSize: 13 }}>/ {numPages}</span>
            <IconButton
              aria-label="Next page"
              onClick={() => onJumpToPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
            >
              <ChevronRightIcon />
            </IconButton>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton aria-label="Zoom out" onClick={zoomOut}>
              <ZoomOutIcon />
            </IconButton>
            <button
              onClick={zoomReset}
              title="Reset zoom (fit width)"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "transparent",
                color: "inherit",
                fontSize: 12,
                padding: "4px 8px",
                cursor: "pointer",
                minWidth: 48,
              }}
            >
              {Math.round(zoomFactor * 100)}%
            </button>
            <IconButton aria-label="Zoom in" onClick={zoomIn}>
              <ZoomInIcon />
            </IconButton>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              aria-label="Fit width"
              active={fitMode === "width" || fitMode === "custom"}
              onClick={() => onFitModeChange("width")}
            >
              <FitWidthIcon />
            </IconButton>
            <IconButton
              aria-label="Fit page"
              active={fitMode === "page"}
              onClick={() => onFitModeChange("page")}
            >
              <FitPageIcon />
            </IconButton>
          </div>

          <IconButton aria-label="Search (Ctrl+F)" onClick={onOpenSearch}>
            <SearchIcon />
          </IconButton>
        </>
      )}

      {/* Right side: PDF theme selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        <span style={{ fontSize: 12, color: "var(--text)", opacity: 0.85 }}>Theme</span>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setThemeOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--code-bg)",
              color: "var(--text-h)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontWeight: 600 }}>{currentMode?.label || "Off"}</span>
            <ChevronDownIcon size={14} />
          </button>
          {themeOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                minWidth: 140,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                padding: 6,
                zIndex: 50,
              }}
            >
              {colorModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onColorModeChange(m.id);
                    setThemeOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    fontSize: 13,
                    border: "none",
                    borderRadius: 6,
                    background: m.id === colorModeId ? "var(--accent-bg)" : "none",
                    color: m.id === colorModeId ? "var(--accent)" : "var(--text-h)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{m.summary}</div>
                </button>
              ))}
            </div>
          )}
        </div>

      
      </div>
    </div>
  );
}