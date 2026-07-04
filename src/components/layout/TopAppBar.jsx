import React, { useState } from "react";
import Button from "../common/Button.jsx";
import IconButton from "../common/IconButton.jsx";
import Popover from "../common/Popover.jsx";
import TabBar from "./TabBar.jsx";
import { MaximizeIcon, MinimizeIcon, MonitorIcon, MoonIcon, SunIcon } from "../common/icons.jsx";

const UI_THEME_ICONS = { light: SunIcon, dark: MoonIcon, system: MonitorIcon };

function MenuButton({ label, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <Button variant="ghost" active={open} onClick={() => setOpen((v) => !v)}>
        {label}
      </Button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.onClick?.();
              setOpen(false);
            }}
            disabled={item.disabled}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 10px",
              fontSize: 13,
              border: "none",
              borderRadius: 6,
              background: "none",
              color: item.disabled ? "var(--text)" : "var(--text-h)",
              opacity: item.disabled ? 0.45 : 1,
              cursor: item.disabled ? "default" : "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
      </Popover>
    </div>
  );
}

// Left = branding + File/Edit/View/Help menus. Center = tab strip (documents
// only, never tools). Right = UI theme toggle + fullscreen — chrome-level
// controls, not document state.
export default function TopAppBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  uiThemeId,
  setUiThemeId,
  isFullscreen,
  onToggleFullscreen,
}) {
  const ThemeIcon = UI_THEME_ICONS[uiThemeId] || UI_THEME_ICONS.system;

  const cycleUiTheme = () => {
    const order = ["light", "dark", "system"];
    const next = order[(order.indexOf(uiThemeId) + 1) % order.length];
    setUiThemeId(next);
  };

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
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <img src="/favicon.svg" alt="" width={20} height={20} />
        <span style={{ fontWeight: 700, fontSize: 14, marginRight: 8 }}>NocturaPDF</span>

        <MenuButton
          label="File"
          items={[
            { label: "Open…", onClick: onAddTab },
            {
              label: "Close Tab",
              onClick: () => activeTabId && onCloseTab(activeTabId),
              disabled: !activeTabId,
            },
          ]}
        />
        <MenuButton label="Edit" items={[{ label: "No actions yet", disabled: true }]} />
        <MenuButton label="View" items={[{ label: "No actions yet", disabled: true }]} />
        <MenuButton label="Help" items={[{ label: "No actions yet", disabled: true }]} />
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
      </div>
    </div>
  );
}
