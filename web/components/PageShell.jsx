import React from "react";
import SiteHeader from "./SiteHeader.jsx";
import SiteFooter from "./SiteFooter.jsx";

// Shared header + footer wrapper for content pages (About, Developers) so
// they stay visually consistent with each other and with the landing page.
export default function PageShell({ title, onNavigate, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader onNavigate={onNavigate} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 88px" }}>
        <h1 style={{ fontSize: 32, color: "var(--text-h)", margin: "0 0 32px" }}>{title}</h1>
        {children}
      </div>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
