import React from "react";
import PageShell from "../components/PageShell.jsx";

const paragraphStyle = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "var(--text)",
  margin: "0 0 16px",
};

const sectionTitleStyle = {
  fontSize: 20,
  fontWeight: 600,
  color: "var(--text-h)",
  margin: "40px 0 16px",
};

const listStyle = {
  margin: "0 0 16px",
  paddingLeft: 20,
  color: "var(--text)",
  lineHeight: 1.7,
  fontSize: 15,
};

function Term({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-h)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14.5,
          color: "var(--text)",
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function DevelopersPage({ onNavigate }) {
  return (
    <PageShell title="Developers" onNavigate={onNavigate}>
      <p style={paragraphStyle}>
        NocturaPDF is an open-source, browser-based PDF reader built around a
        simple idea: provide a fast, focused reading environment without the
        complexity of a traditional document suite.
      </p>

      <p style={paragraphStyle}>
        This page covers the architecture, development stack, storage model,
        project structure, and contribution principles used to build NocturaPDF.
        It is intended for developers who want to understand the codebase,
        contribute to the project, or build on top of it.
      </p>

      <h2 style={sectionTitleStyle}>Project Repository</h2>

      <Term label="Source Code">
        <a
          href="https://github.com/LamrotG/NocturaPDF"
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--text-h)" }}
        >
          github.com/LamrotG/NocturaPDF
        </a>
      </Term>

      <Term label="License">
        MIT License. NocturaPDF is open source and can be used, modified, and
        distributed according to the terms of the license.
      </Term>

      <h2 style={sectionTitleStyle}>Architecture</h2>

      <p style={paragraphStyle}>
        NocturaPDF is a client-side Progressive Web App. The application runs
        primarily in the browser and separates the reading interface, document
        rendering, persistence, authentication, and optional cloud services
        into focused layers.
      </p>

      <Term label="Application">
        React provides the application and user-interface layer. Components are
        organized around the reader, application layout, shared UI, and
        feature-specific functionality.
      </Term>

      <Term label="PDF Rendering">
        PDF documents are rendered using pdfjs-dist, the JavaScript
        distribution of PDF.js. Pages are rendered to canvas and the reader
        provides scrolling, zooming, navigation, and document interaction on
        top of the rendering pipeline.
      </Term>

      <Term label="Persistence">
        Local PDF files are stored using the Origin Private File System (OPFS).
        IndexedDB stores document metadata and application state associated with
        those files.
      </Term>

      <Term label="Cloud Services">
        Supabase provides the optional backend layer for authentication, cloud
        storage, and synchronization. Cloud functionality is intentionally
        separated from the local reading experience.
      </Term>

      <Term label="Offline Runtime">
        A service worker provides the PWA's offline application shell and
        caching behavior. Once the application has been installed and cached,
        the reader can continue to operate without an active network
        connection.
      </Term>

      <h2 style={sectionTitleStyle}>Technology Stack</h2>

      <Term label="Frontend">
        React 19 with JavaScript and JSX.
      </Term>

      <Term label="Build Tool">
        Vite provides development tooling, hot reload, and production builds.
      </Term>

      <Term label="PDF Engine">
        pdfjs-dist with canvas-based rendering.
      </Term>

      <Term label="Storage">
        OPFS for local PDF files and IndexedDB for document metadata and
        persistent application state.
      </Term>

      <Term label="Authentication & Cloud">
        Supabase Authentication, PostgreSQL, and Storage for optional accounts
        and cloud synchronization.
      </Term>

      <Term label="State Management">
        React Context and useReducer. No external state-management library is
        required.
      </Term>

      <Term label="Styling">
        Plain CSS and React inline style objects. No CSS framework is currently
        required by the application.
      </Term>

      <h2 style={sectionTitleStyle}>Data & Storage Model</h2>

      <p style={paragraphStyle}>
        NocturaPDF uses separate storage layers depending on the type and
        lifetime of the data. This keeps local documents independent from
        optional account and cloud functionality.
      </p>

      <Term label="Temporary">
        Runtime state and transient document data are kept in memory while the
        reader is active.
      </Term>

      <Term label="Local Files">
        PDFs in the Local Library are persisted through OPFS, allowing the
        browser application to maintain files locally without requiring a
        server.
      </Term>

      <Term label="Metadata">
        IndexedDB stores metadata associated with local documents, including
        information required to identify and manage documents across sessions.
      </Term>

      <Term label="Cloud">
        Authenticated users can use the optional Supabase layer for cloud
        storage and synchronization across devices.
      </Term>

      <p style={paragraphStyle}>
        The separation is intentional: local reading does not depend on cloud
        services, and enabling an account does not require moving the entire
        reading workflow to the cloud.
      </p>

      <h2 style={sectionTitleStyle}>Project Structure</h2>

      <p style={paragraphStyle}>
        The codebase is organized by responsibility rather than by individual
        screens. The main structure is:
      </p>

      <pre
        style={{
          margin: "0 0 20px",
          padding: 16,
          overflowX: "auto",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 13,
          lineHeight: 1.6,
          border: "1px solid var(--border)",
        }}
      >
{`src/
├── components/
│   ├── common/       Shared UI components
│   ├── layout/       Application chrome and navigation
│   └── reader/       PDF reader and rendering UI
│
├── features/
│   └── darkmode/     Document dark-mode rendering
│
├── hooks/            Reusable React hooks
├── pages/            Application and website pages
├── services/         Persistence and external services
├── store/            Application state
└── utils/            Shared utilities

public/
├── icons/            PWA icons
├── manifest.webmanifest
└── sw.js              Service worker

supabase/
└── schema.sql         Database schema

scripts/
└── generate-icons.ps1 PWA icon generation`}
      </pre>

      <h2 style={sectionTitleStyle}>Local-First Architecture</h2>

      <p style={paragraphStyle}>
        Local-first behavior is one of the core architectural decisions in
        NocturaPDF. Reading a local PDF should not require authentication,
        network access, or a remote backend.
      </p>

      <ul style={listStyle}>
        <li>Local documents remain on the user's device by default.</li>
        <li>Cloud functionality is optional.</li>
        <li>The reader is designed to continue working offline.</li>
        <li>
          Authentication is only required for features that depend on an
          account.
        </li>
        <li>
          The application does not require a traditional server runtime for
          local reading.
        </li>
      </ul>

      <p style={paragraphStyle}>
        This architecture also reduces the amount of infrastructure required
        for the core product and keeps the reading path lightweight.
      </p>

      <h2 style={sectionTitleStyle}>Development</h2>

      <Term label="Requirements">
        Node.js 18 or newer and npm.
      </Term>

      <Term label="Install">
        Clone the repository and install dependencies with npm.
      </Term>

      <pre
        style={{
          margin: "0 0 20px",
          padding: 16,
          overflowX: "auto",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 13,
          lineHeight: 1.6,
          border: "1px solid var(--border)",
        }}
      >
{`git clone https://github.com/LamrotG/NocturaPDF.git
cd NocturaPDF
npm install`}
      </pre>

      <Term label="Development Server">
        Start the Vite development server with:
      </Term>

      <pre
        style={{
          margin: "0 0 20px",
          padding: 16,
          overflowX: "auto",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 13,
          lineHeight: 1.6,
          border: "1px solid var(--border)",
        }}
      >
{`npm run dev`}
      </pre>

      <Term label="Production Build">
        Create a production build with:
      </Term>

      <pre
        style={{
          margin: "0 0 20px",
          padding: 16,
          overflowX: "auto",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 13,
          lineHeight: 1.6,
          border: "1px solid var(--border)",
        }}
      >
{`npm run build`}
      </pre>

      <Term label="Linting">
        Run the project's lint checks with:
      </Term>

      <pre
        style={{
          margin: "0 0 20px",
          padding: 16,
          overflowX: "auto",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 13,
          lineHeight: 1.6,
          border: "1px solid var(--border)",
        }}
      >
{`npm run lint`}
      </pre>

      <h2 style={sectionTitleStyle}>Optional Supabase Development</h2>

      <p style={paragraphStyle}>
        Supabase is optional during development. The local reader can be
        developed and tested without configuring an account or cloud backend.
      </p>

      <p style={paragraphStyle}>
        To enable authentication and cloud functionality, create a Supabase
        project, apply the database schema in{" "}
        <code>supabase/schema.sql</code>, and configure the required environment
        variables using the project's environment template.
      </p>

      <p style={paragraphStyle}>
        Keeping this integration optional is important: changes to cloud
        functionality should not introduce a dependency on the network for
        local PDF reading.
      </p>

      <h2 style={sectionTitleStyle}>Engineering Principles</h2>

      <p style={paragraphStyle}>
        NocturaPDF is intentionally opinionated about how the application
        should evolve.
      </p>

      <ul style={listStyle}>
        <li>Simplicity over unnecessary abstraction</li>
        <li>Performance over unnecessary dependencies</li>
        <li>Reading experience over feature volume</li>
        <li>Local-first behavior over unnecessary network requests</li>
        <li>Clear architecture over tightly coupled components</li>
        <li>Accessibility and usability over visual decoration</li>
        <li>Consistency over unnecessary experimentation</li>
      </ul>

      <p style={paragraphStyle}>
        New functionality should solve a real user problem without adding
        unnecessary complexity to the reader.
      </p>

      <h2 style={sectionTitleStyle}>Contributing</h2>

      <p style={paragraphStyle}>
        Contributions are welcome. Before implementing a significant change,
        review the existing architecture and consider how the change affects
        performance, offline behavior, local storage, and the reading
        experience.
      </p>

      <Term label="Recommended workflow">
        Fork the repository, create a focused feature branch, make the smallest
        practical change, test the affected functionality, and open a pull
        request with a clear description of the change.
      </Term>

      <Term label="Good contribution areas">
        Reader performance, accessibility, UI and UX improvements, PDF
        rendering, annotation capabilities, PWA reliability, local storage,
        synchronization, documentation, and bug fixes.
      </Term>

      <Term label="Pull requests">
        Keep pull requests focused. Avoid combining unrelated refactors,
        formatting changes, and feature work in the same change unless they are
        directly required.
      </Term>

      <h2 style={sectionTitleStyle}>Security & Privacy</h2>

      <p style={paragraphStyle}>
        NocturaPDF is designed so that local document reading does not require
        sending documents to a remote service. The application does not use
        analytics or tracking as part of its core reading experience.
      </p>

      <p style={paragraphStyle}>
        When cloud functionality is enabled, developers should treat
        authentication, storage permissions, database policies, and document
        synchronization as separate security boundaries. Local-first behavior
        should remain intact when cloud services are unavailable.
      </p>

      <h2 style={sectionTitleStyle}>Further Reading</h2>

      <ul style={listStyle}>
        <li>
          Product documentation — learn how NocturaPDF works as a user.
        </li>
        <li>
          GitHub repository — browse the source code, issues, and contribution
          history.
        </li>
        <li>
          PDF.js documentation — understand the underlying PDF rendering
          engine.
        </li>
        <li>
          PWA documentation — understand installation and offline application
          behavior.
        </li>
      </ul>

      <p style={paragraphStyle}>
        NocturaPDF is intentionally small enough to understand and structured
        enough to extend. Developers should be able to enter the codebase,
        understand where a change belongs, and contribute without having to
        understand an unnecessary layer of infrastructure first.
      </p>
    </PageShell>
  );
}