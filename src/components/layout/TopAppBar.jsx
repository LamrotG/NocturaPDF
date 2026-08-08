import React from "react";
import IconButton from "../common/IconButton.jsx";
import AppMenu from "./AppMenu.jsx";
import TabBar from "./TabBar.jsx";
import { MaximizeIcon, MinimizeIcon, MonitorIcon, MoonIcon, SunIcon } from "../common/icons.jsx";

const UI_THEME_ICONS = { light: SunIcon, dark: MoonIcon, system: MonitorIcon };

const isMac =
  typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
const MOD = isMac ? "⌘" : "Ctrl";
const SHIFT = "Shift";
const ALT = isMac ? "⌥" : "Alt";

// Left = File/Edit/View/Help menus (branding lives in the OS window
// title bar / browser tab, not duplicated here). Center = tab strip
// (documents only, never tools). Right = UI theme toggle + fullscreen —
// chrome-level controls, not document state.
export default function TopAppBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onGoHome,
  uiThemeId,
  setUiThemeId,
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
  onToggleSidebar,
  onTogglePresentation,
  onVisitWebsite,
  onUserManual,
  onKeyboardShortcuts,
  onAbout,
  isSignedIn,
  profileName,
  onProfile,
}) {
  const ThemeIcon = UI_THEME_ICONS[uiThemeId] || UI_THEME_ICONS.system;

  const cycleUiTheme = () => {
    const order = ["light", "dark", "system"];
    const next = order[(order.indexOf(uiThemeId) + 1) % order.length];
    setUiThemeId(next);
  };

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
    { label: "Toggle Sidebar", onClick: onToggleSidebar, disabled: !hasDoc },
    { label: "Toggle Presentation Mode", onClick: onTogglePresentation, disabled: !hasDoc },
    { separator: true },
    { label: "Toggle Full Screen", shortcut: "F11", onClick: onToggleFullscreen },
  ];

  const helpItems = [
    { label: "Visit Website", onClick: onVisitWebsite },
    { label: "User Manual", onClick: onUserManual },
    { label: "Keyboard Shortcuts", onClick: onKeyboardShortcuts },
    { separator: true },
    { label: "About", onClick: onAbout },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        color: "var(--text-h)",
        // Top bar is a flex child of the app's column layout — without this,
        // flex items default to min-width:auto and won't shrink below their
        // content's intrinsic width, which is what let a horizontal
        // scrollbar leak out of the whole bar once enough tabs were open.
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Go to home"
          onClick={onGoHome}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            padding: 2,
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "var(--code-bg)",
            color: "var(--accent)",
            cursor: "pointer",
            overflow: "hidden",
          }}
          title="Home"
        >
          <img
            src="/favicon.svg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        </button>
        <AppMenu label="File" items={fileItems} />
        <AppMenu label="Edit" items={editItems} />
        <AppMenu label="View" items={viewItems} />
        <AppMenu label="Help" items={helpItems} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onAddTab={onAddTab}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <IconButton aria-label={`UI theme: ${uiThemeId} (click to cycle)`} onClick={cycleUiTheme}>
          <ThemeIcon />
        </IconButton>
        <IconButton
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          active={isFullscreen}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
        </IconButton>
        {isSignedIn ? (
          <button
            type="button"
            onClick={onProfile}
            title={`Signed in as ${profileName || "user"} — click for profile settings`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--code-bg)",
              color: "var(--text-h)",
              cursor: "pointer",
            }}
          >
            {profileName || "Account"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (window.location.href = "/signin")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}