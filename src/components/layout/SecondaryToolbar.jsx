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
  SidebarIcon,
  ZoomInIcon,
  ZoomOutIcon,
  FullscreenIcon,
  FullscreenExitIcon,
} from "../common/icons.jsx";

// Thin, utility-only bar directly below the tab strip: page nav, zoom, fit
// mode, search entry, PDF theme selector, and fullscreen. No branding.
export default function SecondaryToolbar({
  sidebarCollapsed,
  onToggleSidebar,
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
  isFullscreen,
  onToggleFullscreen,
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
      <IconButton
        aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        active={!sidebarCollapsed}
        onClick={onToggleSidebar}
      >
        <SidebarIcon />
      </IconButton>

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

      {/* Right side: PDF theme selector + fullscreen */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
        {/* PDF theme dropdown */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setThemeOpen(true)}
          onMouseLeave={() => setTimeout(() => setThemeOpen(false), 150)}
        >
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
            <span style={{ opacity: 0.6 }}>Off</span>
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
                    padding: "6px 10px",
                    fontSize: 13,
                    border: "none",
                    borderRadius: 6,
                    background: m.id === colorModeId ? "var(--accent-bg)" : "none",
                    color: m.id === colorModeId ? "var(--accent)" : "var(--text-h)",
                    cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen toggle */}
        <IconButton
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          active={isFullscreen}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <FullscreenExitIcon size={18} /> : <FullscreenIcon size={18} />}
        </IconButton>
      </div>
    </div>
  );
}