import React from "react";

// Text-label button shared by menus/toolbars (e.g. File-menu items, "Open PDF").
export default function Button({ active, variant = "default", style, children, ...props }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid transparent",
    cursor: "pointer",
    background: "transparent",
    color: "inherit",
  };

  const variants = {
    default: {
      border: "1px solid var(--border)",
      background: active ? "var(--accent-bg)" : "transparent",
      color: active ? "var(--accent)" : "var(--text-h)",
      borderColor: active ? "var(--accent-border)" : "var(--border)",
    },
    ghost: {
      background: active ? "var(--code-bg)" : "transparent",
      color: "var(--text-h)",
    },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
