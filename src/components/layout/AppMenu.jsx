import React, { useEffect, useRef, useState } from "react";
import { MenuIcon } from "../common/icons.jsx";

// Renders a menu item, separator, or submenu header inside a popover.
// Supports `disabled`, `separator`, and `submenu` item types.
function MenuItem({ item, onOpenSubmenu, onClose }) {
  if (item.separator) {
    return <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />;
  }

  if (item.header) {
    return (
      <div style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "var(--text-h)", opacity: 0.95 }}>
        {item.header}
      </div>
    );
  }

  if (item.submenu) {
    return (
      <button
        disabled={item.disabled}
        onClick={() => onOpenSubmenu?.(item)}
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
export function MenuPopover({ open, onClose, items, align = "left" }) {
  const ref = useRef(null);
  const popoverRef = useRef(null);
  const [submenuItems, setSubmenuItems] = useState(null);
  
  // Keep the popover fully inside the viewport.
  useEffect(() => {
    if (!open) return;
    const el = popoverRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left;
    let top = rect.top;
    let changed = false;

    if (rect.right > vw) {
      left = Math.max(8, vw - rect.width - 8);
      changed = true;
    }
    if (rect.left < 8) {
      left = 8;
      changed = true;
    }
    if (rect.bottom > vh) {
      top = Math.max(8, vh - rect.height - 8);
      changed = true;
    }
    if (rect.top < 8) {
      top = 8;
      changed = true;
    }

    if (changed) {
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }
  }, [open, submenuItems]);

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
      ref={(node) => {
        ref.current = node;
        popoverRef.current = node;
      }}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: align === "right" ? "auto" : 0,
        right: align === "right" ? 0 : "auto",
        minWidth: submenuItems ? 360 : 220,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 96px)",
        overflowY: "auto",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        padding: 6,
        zIndex: 50,
      }}
    >
      {(submenuItems || items).map((item, i) => (
        <MenuItem
          key={i}
          item={item}
          onOpenSubmenu={(sub) => setSubmenuItems(sub.submenu)}
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

  const toggleMenu = () => setOpen((v) => !v);

  return (
    <div style={{ position: "relative" }}>
      {trigger || (
        <button
          onClick={toggleMenu}
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
