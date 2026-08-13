import React from "react";
import Modal from "../Modal.jsx";

const isMac =
  typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
const MOD = isMac ? "⌘" : "Ctrl";
const ALT = isMac ? "⌥" : "Alt";
const SHIFT = "Shift";

function Shortcut({ keys, action }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--text-h)", fontSize: 13 }}>{action}</span>
      <span style={{ display: "flex", gap: 4 }}>
        {keys.map((k, i) => (
          <kbd
            key={i}
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--code-bg)",
              color: "var(--text-h)",
            }}
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}

function Section({ title, shortcuts }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          margin: "0 0 8px",
        }}
      >
        {title}
      </h3>
      {shortcuts.map((s, i) => (
        <Shortcut key={i} keys={s.keys} action={s.action} />
      ))}
    </div>
  );
}

// Lists every keyboard shortcut the app supports, grouped by category.
export default function KeyboardShortcutsDialog({ open, onClose }) {
  const fileShortcuts = [
    { action: "Open File", keys: [MOD, "O"] },
    { action: "Close Tab", keys: [MOD, "W"] },
    { action: "Save", keys: [MOD, "S"] },
    { action: "Save As", keys: [MOD, SHIFT, "S"] },
    { action: "Print", keys: [MOD, "P"] },
    { action: "Properties", keys: [ALT, "Enter"] },
    { action: "Exit", keys: [MOD, "Q"] },
  ];

  const editShortcuts = [
    { action: "Undo", keys: [MOD, "Z"] },
    { action: "Redo", keys: [MOD, "Y"] },
    { action: "Cut", keys: [MOD, "X"] },
    { action: "Copy", keys: [MOD, "C"] },
    { action: "Paste", keys: [MOD, "V"] },
    { action: "Select All", keys: [MOD, "A"] },
    { action: "Find", keys: [MOD, "F"] },
    { action: "Find Next", keys: ["F3"] },
    { action: "Find Previous", keys: [SHIFT, "F3"] },
  ];

  const viewShortcuts = [
    { action: "Zoom In", keys: [MOD, "+"] },
    { action: "Zoom Out", keys: [MOD, "-"] },
    { action: "Reset Zoom", keys: [MOD, "0"] },
    { action: "Toggle Full Screen", keys: ["F11"] },
    { action: "Toggle Focus Mode", keys: ["F"] },
  ];

  const navShortcuts = [
    { action: "Next Page", keys: ["→"] },
    { action: "Previous Page", keys: ["←"] },
    { action: "Next Page", keys: ["↓"] },
    { action: "Previous Page", keys: ["↑"] },
    { action: "Next Page", keys: ["Space"] },
    { action: "Previous Page", keys: [SHIFT, "Space"] },
    { action: "Close Search / Exit Focus", keys: ["Esc"] },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" width={560}>
      <Section title="File" shortcuts={fileShortcuts} />
      <Section title="Edit" shortcuts={editShortcuts} />
      <Section title="View" shortcuts={viewShortcuts} />
      <Section title="Navigation" shortcuts={navShortcuts} />
    </Modal>
  );
}