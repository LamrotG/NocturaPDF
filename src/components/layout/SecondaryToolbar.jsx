import React from "react";
import Button from "../common/Button.jsx";
import IconButton from "../common/IconButton.jsx";
import { MAX_SCALE, MIN_SCALE, ZOOM_STEP } from "../../utils/constants.js";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FitPageIcon,
  FitWidthIcon,
  SearchIcon,
  SidebarIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "../common/icons.jsx";

// Thin, utility-only bar directly below the tab strip: page nav, zoom, fit
// mode, search entry, and PDF color mode. No branding, no heavy UI.
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
}) {
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

  const handlePageInput = (e) => {
    const value = Number(e.target.value);
    if (!value || value < 1 || value > numPages) return;
    onJumpToPage(value);
  };

  const hasDoc = numPages > 0;

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
              value={currentPage || 1}
              onChange={handlePageInput}
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

      <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
        {colorModes.map((m) => (
          <Button key={m.id} active={colorModeId === m.id} onClick={() => onColorModeChange(m.id)}>
            {m.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

