import React, { useState } from "react";
import Button from "../common/Button.jsx";
import Popover from "../common/Popover.jsx";

// Renders a menu item, separator, or submenu header inside a popover.
// Supports `disabled`, `separator`, and `submenu` item types.
function MenuItem({ item, onHoverSubmenu, onClose }) {
  if (item.separator) {
    return <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />;
  }

  if (item.submenu) {
    return (
      <button
        disabled={item.disabled}
        onMouseEnter={() => onHoverSubmenu?.(item)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
        <span style={{ marginLeft: 12, opacity: 0.5 }}>▸</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        if (!item.disabled) {
          item.onClick?.();
          onClose?.();
        }
      }}
      disabled={item.disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
      <span>{item.label}</span>
      {item.shortcut && (
        <span style={{ marginLeft: 20, opacity: 0.5, fontSize: 11, fontFamily: "var(--mono)" }}>
          {item.shortcut}
        </span>
      )}
    </button>
  );
}

// A dropdown menu button with support for separators, disabled items,
// submenus, and shortcut labels. Used by TopAppBar for File/Edit/View/Help.
export default function AppMenu({ label, items }) {
  const [open, setOpen] = useState(false);
  const [submenuItems, setSubmenuItems] = useState(null);

  const close = () => {
    setOpen(false);
    setSubmenuItems(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <Button
        variant="ghost"
        active={open}
        onClick={() => {
          setOpen((v) => !v);
          setSubmenuItems(null);
        }}
      >
        {label}
      </Button>
      <Popover open={open} onClose={close} width={submenuItems ? 360 : 240}>
        {(submenuItems || items).map((item, i) => (
          <MenuItem
            key={i}
            item={item}
            onHoverSubmenu={(sub) => setSubmenuItems(sub.submenu)}
            onClose={close}
          />
        ))}
        {submenuItems && (
          <button
            onClick={() => setSubmenuItems(null)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 10px",
              fontSize: 12,
              border: "none",
              borderRadius: 6,
              background: "none",
              color: "var(--text)",
              cursor: "pointer",
              marginTop: 4,
              borderTop: "1px solid var(--border)",
              paddingTop: 8,
            }}
          >
            ← Back
          </button>
        )}
      </Popover>
    </div>
  );
}