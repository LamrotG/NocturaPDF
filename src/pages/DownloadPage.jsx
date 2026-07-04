import React from "react";
import PageShell from "../components/common/PageShell.jsx";

const paragraphStyle = { fontSize: 15, lineHeight: 1.7, color: "var(--text)", margin: "0 0 20px" };
const sectionTitleStyle = { fontSize: 20, fontWeight: 600, color: "var(--text-h)", margin: "40px 0 16px" };
const listStyle = { margin: "0 0 20px", paddingLeft: 20, color: "var(--text)", lineHeight: 1.7, fontSize: 15 };

// Plain /releases (not /releases/latest) — it always resolves, even before
// any release has been published, showing GitHub's "no releases yet" page
// instead of a 404. Once a release exists, this list links straight to it.
const RELEASES_URL = "https://github.com/LamrotG/NocturaPDF/releases";

export default function DownloadPage({ onNavigate }) {
  return (
    <PageShell title="Download" onNavigate={onNavigate}>
      <p style={paragraphStyle}>
        NocturaPDF is available as a lightweight desktop app for Windows, built
        on Electron. It starts fast, works fully offline, and reads PDFs
        without any browser chrome around it — using the same reading engine
        as the browser version.
      </p>

      <div style={{ textAlign: "center", margin: "32px 0 40px" }}>
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 10,
            border: "1px solid var(--accent)",
            background: "var(--accent)",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Download App for Windows
        </a>
        <p style={{ fontSize: 13, color: "var(--text)", margin: "12px 0 0" }}>
          Opens the Releases page on GitHub, where the latest installer is
          published. macOS and Linux builds are planned.
        </p>
      </div>

      <h2 style={sectionTitleStyle}>Key features</h2>
      <ul style={listStyle}>
        <li>Careful dark mode that recolors the chrome without distorting the page itself</li>
        <li>Canvas based rendering for smooth scrolling and zoom, even on large files</li>
        <li>Tabs for working across multiple documents at once</li>
        <li>Fully offline — no account, sign up, or cloud dependency</li>
        <li>Starts directly into the reader, with no marketing site in the way</li>
      </ul>

      <h2 style={sectionTitleStyle}>System requirements</h2>
      <ul style={listStyle}>
        <li>Windows 10 or later (64-bit)</li>
        <li>Around 200 MB of free disk space</li>
        <li>No internet connection required after installation</li>
      </ul>

      <h2 style={sectionTitleStyle}>Prefer no install?</h2>
      <p style={paragraphStyle}>
        NocturaPDF also runs directly in your browser, with the same reading
        experience.{" "}
        <button
          onClick={() => onNavigate("/app")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 15,
            color: "var(--accent)",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Start reading in your browser
        </button>
        .
      </p>
    </PageShell>
  );
}
