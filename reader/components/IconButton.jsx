import React from "react";

// Icon-only button used throughout the top app bar / secondary toolbar —
// consistent hit-target size and hover/active states, aria-label required
// (not just enforced by convention: it's a destructured required-looking
// prop so call sites don't forget it on icon-only controls).
export default function IconButton({ active, size = 32, "aria-label": ariaLabel, style, children, ...props }) {
  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        padding: 0,
        borderRadius: 6,
        border: "1px solid transparent",
        cursor: "pointer",
        background: active ? "var(--accent-bg)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-h)",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
