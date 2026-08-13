import React from "react";

// Shared footer for every public page (landing, About, Documentation,
// Developers, sign in/up). No "Get App" link — the app is a PWA now.
export default function SiteFooter({ onNavigate }) {
  const year = new Date().getFullYear();
  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 16,
          maxWidth: 1040,
          margin: "0 auto",
          fontSize: 13,
          color: "var(--text)",
        }}
      >
        <span>© {year} NocturaPDF</span>

        <nav style={{ display: "flex", gap: 20 }}>
          <button
            style={{ fontSize: 13, color: "var(--text)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            onClick={() => onNavigate("/about")}
          >
            About
          </button>
          <button
            style={{ fontSize: 13, color: "var(--text)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            onClick={() => onNavigate("/docs")}
          >
            Documentation
          </button>
          <button
            style={{ fontSize: 13, color: "var(--text)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            onClick={() => onNavigate("/developers")}
          >
            Developers
          </button>
        </nav>
      </div>
    </div>
  );
}