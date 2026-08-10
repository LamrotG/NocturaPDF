import React, { useEffect, useRef, useState } from "react";
import { MenuIcon } from "../common/icons.jsx";

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

// Internal popover menu used by AppMenu, HelpMenu, and other dropdown menus.
export function MenuPopover({ open, onClose, items }) {
  const ref = useRef(null);
  const [submenuItems, setSubmenuItems] = useState(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        minWidth: submenuItems ? 360 : 220,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        padding: 6,
        zIndex: 50,
      }}
      onMouseLeave={(e) => {
        // Close if the pointer leaves the entire menu.
        if (!ref.current?.contains(e.relatedTarget)) {
          // Small delay so moving between parent/submenu works.
          setTimeout(() => onClose?.(), 150);
        }
      }}
    >
      {(submenuItems || items).map((item, i) => (
        <MenuItem
          key={i}
          item={item}
          onHoverSubmenu={(sub) => setSubmenuItems(sub.submenu)}
          onClose={onClose}
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
    </div>
  );
}

// Wraps a trigger element with a dropdown menu that opens on hover and click.
export default function AppMenu({ items, trigger, triggerLabel }) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const openMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  };

  const closeMenu = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      {trigger || (
        <button
          onClick={openMenu}
          aria-label={triggerLabel}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            border: "none",
            borderRadius: 8,
            background: open ? "var(--code-bg)" : "transparent",
            color: "var(--text-h)",
            cursor: "pointer",
          }}
        >
          <MenuIcon size={18} />
        </button>
      )}
      <MenuPopover
        open={open}
        onClose={() => setOpen(false)}
        items={items}
      />
    </div>
  );
}