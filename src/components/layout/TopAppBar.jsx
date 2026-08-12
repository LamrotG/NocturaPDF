import React, { useState } from "react";
import IconButton from "../common/IconButton.jsx";
import AppMenu, { MenuPopover } from "./AppMenu.jsx";
import TabBar from "./TabBar.jsx";
import { HomeIcon, HelpIcon, MenuIcon, FullscreenIcon, FullscreenExitIcon } from "../common/icons.jsx";

const isMac =
  typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
const MOD = isMac ? "⌘" : "Ctrl";
const SHIFT = "Shift";
const ALT = isMac ? "⌥" : "Alt";

// Top application bar: Home + Menu on left, open PDF tabs in center,
// Help + window controls on right. Profile and theme toggle have been
// removed — profile lives in the left sidebar, app theme lives in Settings.
export default function TopAppBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onGoHome,
  isFullscreen,
  onToggleFullscreen,
  // Menu actions
  hasDoc,
  recentFiles,
  onOpenRecent,
  onClearRecent,
  onSave,
  onSaveAs,
  onPrint,
  onProperties,
  onFind,
  onFindNext,
  onFindPrevious,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitWidth,
  onFitPage,
  onActualSize,
  onRotateCW,
  onRotateCCW,
  onTogglePresentation,
  onVisitWebsite,
  onUserManual,
  onKeyboardShortcuts,
  onAbout,
  onAboutThemes,
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  const fileItems = [
    { label: "Open…", shortcut: `${MOD}+O`, onClick: onAddTab },
    { label: "Close", shortcut: `${MOD}+W`, onClick: () => activeTabId && onCloseTab(activeTabId), disabled: !hasDoc },
    { separator: true },
    {
      label: "Open Recent",
      submenu: (recentFiles && recentFiles.length > 0)
        ? [
            ...recentFiles.map((f) => ({
              label: f.name,
              onClick: () => onOpenRecent?.(f),
            })),
            { separator: true },
            { label: "Clear Recent Files", onClick: onClearRecent },
          ]
        : [{ label: "No Recent Files", disabled: true }],
    },
    { separator: true },
    { label: "Save", shortcut: `${MOD}+S`, onClick: onSave, disabled: !hasDoc },
    { label: "Save As…", shortcut: `${MOD}+${SHIFT}+S`, onClick: onSaveAs, disabled: !hasDoc },
    { separator: true },
    { label: "Print…", shortcut: `${MOD}+P`, onClick: onPrint, disabled: !hasDoc },
    { separator: true },
    { label: "Properties", shortcut: `${ALT}+Enter`, onClick: onProperties, disabled: !hasDoc },
  ];

  const editItems = [
    { label: "Undo", shortcut: `${MOD}+Z`, onClick: () => document.execCommand("undo"), disabled: !hasDoc },
    { label: "Redo", shortcut: `${MOD}+Y`, onClick: () => document.execCommand("redo"), disabled: !hasDoc },
    { separator: true },
    { label: "Cut", shortcut: `${MOD}+X`, onClick: () => document.execCommand("cut"), disabled: !hasDoc },
    { label: "Copy", shortcut: `${MOD}+C`, onClick: () => document.execCommand("copy"), disabled: !hasDoc },
    { label: "Paste", shortcut: `${MOD}+V`, onClick: () => document.execCommand("paste"), disabled: !hasDoc },
    { label: "Select All", shortcut: `${MOD}+A`, onClick: () => document.execCommand("selectAll"), disabled: !hasDoc },
    { separator: true },
    { label: "Find", shortcut: `${MOD}+F`, onClick: onFind, disabled: !hasDoc },
    { label: "Find Next", shortcut: "F3", onClick: onFindNext, disabled: !hasDoc },
    { label: "Find Previous", shortcut: `${SHIFT}+F3`, onClick: onFindPrevious, disabled: !hasDoc },
  ];

  const viewItems = [
    { label: "Zoom In", shortcut: `${MOD}++`, onClick: onZoomIn, disabled: !hasDoc },
    { label: "Zoom Out", shortcut: `${MOD}+-`, onClick: onZoomOut, disabled: !hasDoc },
    { label: "Reset Zoom", shortcut: `${MOD}+0`, onClick: onZoomReset, disabled: !hasDoc },
    { separator: true },
    { label: "Fit to Width", onClick: onFitWidth, disabled: !hasDoc },
    { label: "Fit to Page", onClick: onFitPage, disabled: !hasDoc },
    { label: "Actual Size", onClick: onActualSize, disabled: !hasDoc },
    { separator: true },
    { label: "Rotate Clockwise", onClick: onRotateCW, disabled: !hasDoc },
    { label: "Rotate Counterclockwise", onClick: onRotateCCW, disabled: !hasDoc },
    { separator: true },
    { label: "Toggle Presentation Mode", onClick: onTogglePresentation, disabled: !hasDoc },
  ];

  const helpItems = [
    { label: "Visit Website", onClick: onVisitWebsite },
    { label: "User Manual", onClick: onUserManual },
    { label: "Keyboard Shortcuts", onClick: onKeyboardShortcuts },
    { label: "About Themes", onClick: onAboutThemes },
    { separator: true },
    { label: "About", onClick: onAbout },
  ];

  // All menus grouped under the hamburger menu.
  // File / Edit / View appear as sections under the Menu button with headers
  // and horizontal separators between groups. Navigation and submenus work
  // on click only (no hover-driven open).
  const menuItems = [
    { header: "File" },
    ...fileItems,
    { separator: true },
    { header: "Edit" },
    ...editItems,
    { separator: true },
    { header: "View" },
    ...viewItems,
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 10px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        color: "var(--text-h)",
        minWidth: 0,
      }}
    >
      {/* Left: Home + Menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <IconButton aria-label="Home" title="Home" onClick={onGoHome}>
          <HomeIcon size={18} />
        </IconButton>
        <AppMenu items={menuItems} triggerLabel="Menu" />
      </div>

      {/* Center: PDF tabs */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onAddTab={onAddTab}
        />
      </div>

      {/* Right: Help + window controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <IconButton
            aria-label="Help"
            title="Help"
            active={helpOpen}
            onClick={() => setHelpOpen((v) => !v)}
          >
            <HelpIcon size={18} />
          </IconButton>
          <MenuPopover
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
            items={helpItems}
            align="right"
          />
        </div>
        <IconButton
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen (F11)" : "Enter fullscreen (F11)"}
          active={isFullscreen}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <FullscreenExitIcon size={18} /> : <FullscreenIcon size={18} />}
        </IconButton>
      </div>
    </div>
  );
}
