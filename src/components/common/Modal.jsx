import React, { useEffect } from "react";

// A reusable modal dialog. Renders a centered card over a dimmed backdrop when
// `open` is true, and calls `onClose` when the backdrop or Escape is pressed.
// The dialog's title and max width are configurable; body content is provided
// via children.
export default function Modal({ open, onClose, title, width = 480, children }) {
  // Close on Escape key. Registered only while open to avoid stealing the key
  // from other handlers when the dialog is hidden.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0, 0, 0, 0.45)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--bg)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "var(--shadow)",
          padding: 24,
        }}
      >
        {title && (
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-h)",
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}