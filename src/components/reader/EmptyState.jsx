import React from "react";
import { PlusIcon } from "../common/icons.jsx";

// The official NocturaPDF start screen — shown whenever no document is open.
// The whole card is clickable (not just the "+"), since it's the single
// call-to-action on an otherwise empty screen.
export default function EmptyState({ onOpenFile }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={onOpenFile}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "48px 56px",
          borderRadius: 16,
          border: "1px dashed var(--border)",
          background: "var(--code-bg)",
          color: "var(--text-h)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--accent-bg)",
            color: "var(--accent)",
          }}
        >
          <PlusIcon size={32} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 500 }}>Open a PDF to start reading</span>
      </button>
    </div>
  );
}
