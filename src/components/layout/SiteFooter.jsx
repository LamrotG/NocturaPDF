import React from "react";

const navLinkStyle = {
  fontSize: 14,
  color: "var(--text)",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

// Shared footer for every public page (Home, About, Developers, Download) so
// navigation and branding stay identical across the site.
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

        <button style={navLinkStyle} onClick={() => onNavigate("/download")}>
          Get App
        </button>
      </div>
    </div>
  );
}
