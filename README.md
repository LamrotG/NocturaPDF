# NocturaPDF

A dark, focused, offline-first PDF reader for the browser — installable as a
Progressive Web App (PWA).

NocturaPDF is intentionally minimal: no account required for local reading, no
forced cloud sync. Open a PDF and read it, with a dark mode that recolors the
interface without distorting the page itself.

## Features

- Careful dark mode that recolors the chrome, not the document content
- Canvas based rendering (pdf.js) with smooth scrolling and zoom
- Tabs for reading multiple documents at once
- Collapsible sidebar and a distraction-free focus mode
- Offline-first PWA (installable, works without a network after first load)
- Account is optional — local files stay on your device
- Optional account for syncing your library across devices

## Technology stack

- **Frontend:** React 19, plain JavaScript/JSX (no TypeScript, no CSS
  framework — inline style objects plus a handful of plain CSS files for
  hover states and media queries)
- **PDF rendering:** [pdfjs-dist](https://github.com/mozilla/pdf.js), canvas
  based rendering with a color remapping layer for dark mode
- **Runtime:** Progressive Web App with a service worker for offline support
- **Local storage:** OPFS (Origin Private File System) for the Local Library,
  IndexedDB for metadata
- **Auth & cloud sync (optional):** Supabase (Authentication, PostgreSQL,
  Storage)
- **Build tooling:** Vite
- **State management:** React Context + `useReducer`, no external state
  library

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

### Installation

```bash
git clone https://github.com/LamrotG/NocturaPDF.git
cd NocturaPDF
npm install
```

### Development

Run the app in the browser with hot reload:

```bash
npm run dev
```

### Optional Supabase setup

To enable accounts and cloud sync:

1. Create a project at [supabase.com](https://supabase.com).
2. In Supabase, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` to `.env` and fill in your project URL and anon key.

Without Supabase configured, the app still works — you can read PDFs locally
with no account.

### Linting

```bash
npm run lint
```

## Building

Build the PWA for production:

```bash
npm run build
```

Output is written to `dist/`. The service worker and manifest enable
installation as a PWA when served over HTTPS (or localhost).

## Project structure

```
public/
  icons/           PWA icons (192, 512, maskable)
  manifest.webmanifest   PWA manifest
  sw.js            Service worker (offline caching)
src/
  components/
    common/        Shared UI primitives (Button, Modal, PageShell, ...)
    layout/        App chrome (TopAppBar, Sidebar, TabBar, SiteHeader/Footer)
    reader/        PDF viewing surface (PdfViewer, PageCanvas, EmptyState)
  features/
    darkmode/      Dark-mode color remapping engine for rendered pages
  hooks/           React hooks (routing, keyboard shortcuts, theme, auth, ...)
  pages/           Public site pages (Landing, About, Docs, Developers, Sign In/Up)
  services/        Persistence (localStorage, OPFS, IndexedDB, Supabase)
  store/           App-wide state (open tabs, active document)
  utils/           Small shared helpers and constants
supabase/
  schema.sql       Supabase schema (run in SQL Editor)
scripts/
  generate-icons.ps1   Regenerates PWA icons from build/icon.png
```

## License

Licensed under the [MIT License](LICENSE).