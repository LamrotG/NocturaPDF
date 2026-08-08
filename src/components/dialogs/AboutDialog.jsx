import React from "react";
import Modal from "../common/Modal.jsx";

const APP_INFO = {
  name: "NocturaPDF",
  version: "0.2.0",
  author: "Lamrot Gashaw",
  license: "MIT",
  website: "https://github.com/LamrotG/NocturaPDF",
};
const APP_DESCRIPTION = "A dark, focused, offline-first PDF reader for the browser.";

// Displays application information: name, version, author, license, and
// runtime details (browser/OS) for the PWA.
export default function AboutDialog({ open, onClose }) {
  const platform = typeof navigator !== "undefined" ? navigator.platform : "";
  const browser = typeof navigator !== "undefined" ? navigator.userAgent : "";

  return (
    <Modal open={open} onClose={onClose} title={`About ${APP_INFO.name}`} width={440}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 16px",
            borderRadius: 16,
            background: "var(--accent-bg)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          N
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, color: "var(--text-h)" }}>
          {APP_INFO.name}
        </h2>
        <p style={{ color: "var(--text)", fontSize: 14, margin: "0 0 4px" }}>
          Version {APP_INFO.version}
        </p>
        <p style={{ color: "var(--text)", fontSize: 13, margin: 0 }}>
          {APP_DESCRIPTION}
        </p>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "var(--text)" }}>Author</span>
          <span style={{ color: "var(--text-h)" }}>{APP_INFO.author}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "var(--text)" }}>License</span>
          <span style={{ color: "var(--text-h)" }}>{APP_INFO.license}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "var(--text)" }}>Platform</span>
          <span style={{ color: "var(--text-h)" }}>{platform}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "var(--text)" }}>Runtime</span>
          <span style={{ color: "var(--text-h)" }}>PWA</span>
        </div>
        {browser && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text)" }}>Browser</span>
            <span style={{ color: "var(--text-h)", textAlign: "right", wordBreak: "break-all" }}>
              {browser.slice(0, 80)}…
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <a
          href={APP_INFO.website}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--accent)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          {APP_INFO.website}
        </a>
      </div>
    </Modal>
  );
}