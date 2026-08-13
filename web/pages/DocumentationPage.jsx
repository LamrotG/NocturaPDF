import React from "react";
import PageShell from "../components/PageShell.jsx";

const paragraphStyle = { fontSize: 15, lineHeight: 1.7, color: "var(--text)", margin: "0 0 20px" };
const sectionTitleStyle = { fontSize: 20, fontWeight: 600, color: "var(--text-h)", margin: "40px 0 16px" };
const listStyle = { margin: "0 0 20px", paddingLeft: 20, color: "var(--text)", lineHeight: 1.7, fontSize: 15 };

export default function DocumentationPage({ onNavigate }) {
  return (
    <PageShell title="Documentation" onNavigate={onNavigate}>
      <p style={paragraphStyle}>
        Documentation for NocturaPDF is being prepared and will be added here
        soon. This page will cover installation, usage, keyboard shortcuts,
        dark mode, and the PWA features.
      </p>

      <h2 style={sectionTitleStyle}>Coming soon</h2>
      <ul style={listStyle}>
        <li>Getting started with NocturaPDF</li>
        <li>Reading PDFs locally (no account required)</li>
        <li>Creating an account and syncing your library</li>
        <li>Dark mode and PDF color modes</li>
        <li>Keyboard shortcuts reference</li>
        <li>Installing NocturaPDF as a PWA</li>
      </ul>
    </PageShell>
  );
}