import React, { useEffect, useRef } from "react";

// Anchored popover: renders `children` in a positioned box below the
// trigger, closes on outside click or Esc. Used by TopAppBar's File/Edit/
// View/Help menus and SettingsPanel — deliberately not a full modal (no
// backdrop/focus-trap), since these are lightweight menus, not dialogs.
export default function Popover({ open, onClose, align = "left", width = 200, children }) {
  const ref = useRef(null);

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
        [align]: 0,
        minWidth: width,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        padding: 6,
        zIndex: 50,
      }}
    >
      {children}
    </div>
  );
}
