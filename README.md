# NocturaPDF

A dark, focused PDF reader for long reads — built for the browser and packaged
as a lightweight Windows desktop app.

NocturaPDF is intentionally minimal: no accounts, no cloud sync, no file
management. Open a PDF and read it, with a dark mode that recolors the
interface without distorting the page itself.

## Features

- Careful dark mode that recolors the chrome, not the document content
- Canvas based rendering (pdf.js) with smooth scrolling and zoom
- Tabs for reading multiple documents at once
- Collapsible sidebar and a distraction-free focus mode
- Fully offline, no account required
- Desktop app (Electron) that opens straight into the reader, and a browser
  version that shares the same reading engine

## Technology stack

- **Frontend:** React 19, plain JavaScript/JSX (no TypeScript, no CSS
  framework — inline style objects plus a handful of plain CSS files for
  hover states and media queries)
- **PDF rendering:** [pdfjs-dist](https://github.com/mozilla/pdf.js), canvas
  based rendering with a color remapping layer for dark mode
- **Desktop runtime:** Electron
- **Build tooling:** Vite, electron-builder
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

Run the desktop (Electron) build against the dev server — in a second
terminal, once `npm run dev` is running:

```bash
npm run electron
```

The desktop app always opens directly into the reader, regardless of the
web app's landing page.

### Linting

```bash
npm run lint
```

## Building

Build the web app for production:

```bash
npm run build
```

Output is written to `dist/`.

### Desktop installer

Package the Windows installer with electron-builder:

```bash
npm run electron:build
```

The installer is written to `release/`. The app icon is generated from
`build/icon.ico`.

## Project structure

```
electron/         Electron main process, preload script, native menu
src/
  components/
    common/        Shared UI primitives (Button, Modal, PageShell, ...)
    layout/        App chrome (TopAppBar, Sidebar, TabBar, SiteHeader/Footer)
    reader/        PDF viewing surface (PdfViewer, PageCanvas, EmptyState)
  features/
    darkmode/      Dark-mode color remapping engine for rendered pages
  hooks/           React hooks (routing, keyboard shortcuts, theme, ...)
  pages/           Public site pages (Home, About, Developers, Download)
  services/        Persistence (localStorage-backed settings)
  store/           App-wide state (open tabs, active document)
  utils/           Small shared helpers and constants
build/             Application icon assets used by electron-builder
public/            Static assets served as-is (favicon)
```

## Desktop application

The desktop build is an Electron wrapper around the same React app and
reading engine as the browser version. On launch it skips the marketing
site entirely and opens directly into the PDF reader, behaving like a
native reader app rather than a website. See [Building](#building) above
for how to build the installer, or grab the latest release from the
[Releases page](https://github.com/LamrotG/NocturaPDF/releases/latest).

## License

Licensed under the [MIT License](LICENSE).
