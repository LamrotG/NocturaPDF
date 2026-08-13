import React from "react";

const navLinkStyle = {
  fontSize: 14,
  color: "var(--text)",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

// Shared top bar for every public page (landing, About, Documentation,
// Developers, sign in/up). The logo itself acts as "Home" — clicking it
// returns to the landing page. Navigation: About, Documentation, Developers.
export default function SiteHeader({ onNavigate }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 16,
          padding: "16px 24px",
          maxWidth: 1040,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => onNavigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-h)",
            padding: 0,
            justifySelf: "start",
          }}
        >
          <img src="/favicon.svg" alt="" width={22} height={22} />
          NocturaPDF
        </button>

        <nav style={{ display: "flex", gap: 24 }}>
          <button style={navLinkStyle} onClick={() => onNavigate("/about")}>
            About
          </button>
          <button style={navLinkStyle} onClick={() => onNavigate("/docs")}>
            Documentation
          </button>
          <button style={navLinkStyle} onClick={() => onNavigate("/developers")}>
            Developers
          </button>
        </nav>

        <div style={{ justifySelf: "end" }}>
          <button
            onClick={() => onNavigate("/signup")}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}