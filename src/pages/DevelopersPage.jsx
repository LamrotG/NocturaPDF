import React from "react";
import PageShell from "../components/common/PageShell.jsx";

const paragraphStyle = { fontSize: 15, lineHeight: 1.7, color: "var(--text)", margin: "0 0 16px" };
const sectionTitleStyle = { fontSize: 20, fontWeight: 600, color: "var(--text-h)", margin: "40px 0 16px" };
const listStyle = { margin: "0 0 16px", paddingLeft: 20, color: "var(--text)", lineHeight: 1.7, fontSize: 15 };

function Term({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export default function DevelopersPage({ onNavigate }) {
  return (
    <PageShell title="Developers" onNavigate={onNavigate}>
      <p style={paragraphStyle}>
        NocturaPDF is an open source, lightweight PDF reader built for focused
        reading.
      </p>
      <p style={paragraphStyle}>
        It is designed to be minimal, fast, and distraction free while remaining
        easy to extend. The goal is simple: build a calm, high performance
        reading environment for students and professionals.
      </p>

      <h2 style={sectionTitleStyle}>Stack Overview</h2>
      <Term label="Frontend">
        React, plain JavaScript and JSX. No TypeScript or CSS framework yet.
        Styling is inline style objects, plus a small number of plain CSS files
        for the rules inline styles cannot express (hover states, media
        queries).
      </Term>
      <Term label="Desktop Runtime">Electron.</Term>
      <Term label="Build Tooling">Vite, Electron Builder.</Term>
      <Term label="PDF Rendering">
        A pdf.js based rendering pipeline (pdfjs-dist), with canvas based page
        rendering and a color remapping layer for dark mode.
      </Term>
      <Term label="State Management">
        Lightweight local state using React Context and useReducer. No external
        state library.
      </Term>

      <h2 style={sectionTitleStyle}>Electron Architecture</h2>
      <p style={paragraphStyle}>
        NocturaPDF follows a standard Electron multi process architecture.
      </p>
      <Term label="Main Process">
        Handles application lifecycle, manages windows, and controls system
        level interactions.
      </Term>
      <Term label="Renderer Process">
        Handles UI rendering, PDF viewing, and user interaction.
      </Term>
      <Term label="Preload Layer">
        A secure communication bridge between the main process and the
        renderer, using context isolation for safety and stability.
      </Term>
      <Term label="Core Principle">
        The renderer process is isolated from Node.js APIs. This keeps the app
        secure, stable, and predictable.
      </Term>

      <h2 style={sectionTitleStyle}>Performance Philosophy</h2>
      <p style={paragraphStyle}>
        NocturaPDF is built with performance as a core constraint.
      </p>
      <ul style={listStyle}>
        <li>Minimal dependencies, avoid unnecessary libraries</li>
        <li>Fast startup time</li>
        <li>Efficient PDF rendering pipeline</li>
        <li>No background computation overhead</li>
        <li>No analytics or tracking</li>
      </ul>
      <p style={paragraphStyle}>
        Rendering focus: canvas based PDF rendering, smooth scrolling and zoom,
        and stable memory usage during long reading sessions. The goal is to
        stay responsive on modest hardware and with large PDF files.
      </p>

      <h2 style={sectionTitleStyle}>Open Source</h2>
      <p style={paragraphStyle}>
        NocturaPDF is intended to be open source. The public repository link
        will be added here once it is published.
      </p>
      <Term label="How to contribute">
        Fork the repository, create a feature branch, make focused and minimal
        changes, and submit a pull request.
      </Term>
      <Term label="Contribution areas">
        UI and UX improvements, performance optimizations, bug fixes,
        accessibility improvements, Electron stability and packaging.
      </Term>
      <p style={paragraphStyle}>
        Keep changes minimal, intentional, and aligned with the product
        philosophy.
      </p>

      <h2 style={sectionTitleStyle}>Design Philosophy</h2>
      <p style={paragraphStyle}>
        NocturaPDF is not a feature heavy application. It is a focused reading
        environment.
      </p>
      <ul style={listStyle}>
        <li>Simplicity over complexity</li>
        <li>Performance over feature expansion</li>
        <li>Clarity over decoration</li>
        <li>Consistency over experimentation</li>
      </ul>
      <p style={paragraphStyle}>
        Every contribution should respect the reading experience first. The
        interface should stay calm, minimal, and distraction free.
      </p>
    </PageShell>
  );
}
