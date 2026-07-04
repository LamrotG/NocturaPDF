import React from "react";
import PageShell from "../components/common/PageShell.jsx";

const paragraphStyle = { fontSize: 15, lineHeight: 1.7, color: "var(--text)", margin: "0 0 20px" };
const sectionTitleStyle = { fontSize: 20, fontWeight: 600, color: "var(--text-h)", margin: "40px 0 16px" };
const listStyle = { margin: "0 0 20px", paddingLeft: 20, color: "var(--text)", lineHeight: 1.7, fontSize: 15 };

export default function AboutPage({ onNavigate }) {
  return (
    <PageShell title="About" onNavigate={onNavigate}>
      <p style={paragraphStyle}>
        NocturaPDF is a focused PDF reader built for reading, not for managing
        files or juggling tools.
      </p>
      <p style={paragraphStyle}>
        The interface stays out of the way. Dark mode is applied carefully so it
        never distorts the page itself, only the chrome around it. Every feature
        is judged by one question: does it help someone read.
      </p>
      <p style={paragraphStyle}>
        NocturaPDF works fully offline, requires no account, and opens a file in
        seconds. It is meant to be simple enough to forget you are using it.
      </p>

      <h2 style={sectionTitleStyle}>Why NocturaPDF exists</h2>
      <p style={paragraphStyle}>
        Most PDF readers try to be everything at once: file managers, editors,
        cloud sync clients, e-signature tools. That breadth comes at a cost —
        cluttered toolbars, accounts you never asked for, and an interface that
        competes with the document for your attention. NocturaPDF starts from
        the opposite question: what does someone actually need while reading a
        long document late at night, and what can be left out entirely.
      </p>
      <p style={paragraphStyle}>
        The answer shaped a reader with a small, deliberate feature set — dark
        mode that respects the page, fast rendering, and a layout that gets out
        of the way — instead of a large one built by accumulation.
      </p>

      <h2 style={sectionTitleStyle}>What it offers today</h2>
      <ul style={listStyle}>
        <li>Careful dark mode that recolors the chrome without distorting the page content itself</li>
        <li>Canvas based rendering for smooth scrolling and zoom, even on large files</li>
        <li>Tabs for working across multiple documents at once</li>
        <li>A collapsible sidebar and focus mode for a distraction free layout</li>
        <li>Fully offline reading with no account, sign up, or cloud dependency</li>
      </ul>

      <h2 style={sectionTitleStyle}>Who it's for</h2>
      <p style={paragraphStyle}>
        Students working through long readings, professionals reviewing
        documents late in the day, and anyone who reads PDFs often enough to
        feel the eye strain and clutter that most readers add along the way.
        If the goal is simply to read — not annotate, sign, convert, or
        manage a file library — NocturaPDF is built for that moment.
      </p>

      <h2 style={sectionTitleStyle}>Our vision</h2>
      <p style={paragraphStyle}>
        NocturaPDF is meant to stay small on purpose. Growth means getting
        better at reading — faster rendering, a calmer dark mode, smoother
        navigation — rather than adding tools that pull focus away from the
        page. The desktop app and the browser version share the same reading
        engine today, and future work follows the same principle every
        feature already has to answer to: does this help someone read.
      </p>
    </PageShell>
  );
}
