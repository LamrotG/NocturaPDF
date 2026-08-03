# NocturaPDF — Technical Presentation Guide

> **Author:** Lamrot Gashaw  
> **Version:** 0.1.0  
> **License:** MIT  
> **Repository:** https://github.com/LamrotG/NocturaPDF

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Project Structure](#4-project-structure)
5. [File-by-File Breakdown](#5-file-by-file-breakdown)
6. [Key Implementation Details](#6-key-implementation-details)
7. [Software Engineering Principles](#7-software-engineering-principles)
8. [Data Flow & State Management](#8-data-flow--state-management)
9. [Performance Optimizations](#9-performance-optimizations)
10. [Security Considerations](#10-security-considerations)
11. [Build & Deployment](#11-build--deployment)
12. [Talking Points for Your Presentation](#12-talking-points-for-your-presentation)

---

## 1. Project Overview

**NocturaPDF** is a dark, focused, offline PDF reader designed for long reading sessions. It runs both as a **browser application** and as a **Windows desktop application** (via Electron), sharing the same reading engine.

### Core Product Philosophy
- **Minimal by design** — no accounts, no cloud sync, no file management
- **Reading-first** — the interface stays out of the way
- **Careful dark mode** — recolors the UI chrome without distorting the PDF page content
- **Fully offline** — no internet connection required

### Key Features
| Feature | Description |
|---------|-------------|
| **Dark Mode** | Recolors UI chrome + optional PDF page recoloring via a color-remapping engine |
| **Canvas Rendering** | pdf.js-based rendering with smooth scrolling and zoom |
| **Tabs** | Open multiple PDFs simultaneously |
| **Sidebar** | Page thumbnails + document outline (bookmarks) |
| **Focus Mode** | Hides all chrome for distraction-free reading |
| **Presentation Mode** | Fullscreen, chrome-hidden reading |
| **Recent Files** | localStorage-backed history with thumbnails |
| **Keyboard Shortcuts** | Full shortcut support (Ctrl+O, Ctrl+S, F11, arrows, etc.) |
| **Desktop Integration** | Native file dialogs, file explorer integration, native menu |

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.2.4 | UI rendering |
| **Language** | JavaScript (JSX) | — | No TypeScript — deliberate choice for simplicity |
| **PDF Rendering** | pdfjs-dist | 5.5.207 | Mozilla's PDF.js library for parsing & rendering PDFs |
| **Desktop Runtime** | Electron | 43.0.0 | Cross-platform desktop wrapper |
| **Build Tooling** | Vite | 8.0.0 | Fast dev server + production bundling |
| **Packaging** | electron-builder | 26.15.3 | Windows NSIS installer generation |
| **State Management** | React Context + useReducer | — | No external state library |
| **Styling** | Inline style objects + minimal CSS | — | No CSS framework |
| **Linting** | ESLint | 9.39.4 | Code quality enforcement |
| **Icons** | Hand-rolled SVG components | — | No icon library dependency |

### Why These Choices?
- **React 19** — modern, widely known, excellent ecosystem
- **pdfjs-dist** — the industry-standard PDF rendering library (used by Firefox)
- **No TypeScript** — keeps the codebase approachable and reduces build complexity
- **No CSS framework** — inline styles keep components self-contained and themeable via CSS variables
- **No state library** — the app's state is small enough that Context + useReducer is sufficient
- **Electron** — allows the same React codebase to run as a native desktop app

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON LAYER (Desktop Only)             │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │  Main Process   │    │  Preload Script              │    │
│  │  (main.cjs)     │◄──►│  (ppreload.cjs)              │    │
│  │                 │ IPC│                               │    │
│  │  - Window mgmt  │    │  - contextBridge             │    │
│  │  - File I/O     │    │  - ipcRenderer wrapper       │    │
│  │  - Native menu  │    │  - isElectron flag           │    │
│  │  - Update check │    │  - Secure API exposure       │    │
│  └─────────────────┘    └──────────────────────────────┘    │
│         │                                                     │
│         └─── Native Menu (menu.cjs) ──builds File/Edit/       │
│              View/Help menus with accelerators & state        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                REACT RENDERER LAYER                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  main.jsx → App.jsx (root, routing, orchestration)   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Providers│ │  Hooks   │ │ Services │ │    Utils     │   │
│  │ useUiTheme│ │useKeyboard│ │ storage  │ │  constants  │   │
│  │usePdfColor│ │useRoute  │ │ settings  │ │  helpers    │   │
│  │ appstore │ │useUiTheme│ │  recent  │ │  css vars   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Components (3 layers)                                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │   │
│  │  │ common/      │ │ layout/      │ │ reader/      │  │   │
│  │  │ Button,Modal │ │ TopAppBar,   │ │ PdfViewer,   │  │   │
│  │  │ Popover,etc  │ │ Sidebar,Tab  │ │ PageCanvas,  │  │   │
│  │  │              │ │ Bar,etc      │ │ Scroll,etc   │  │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘  │   │
│  │                                                       │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │   │
│  │  │ dialogs/     │ │ pages/       │ │ features/    │  │   │
│  │  │ About,Props  │ │ Landing,     │ │ darkmode/    │  │   │
│  │  │ Shortcuts    │ │ About,etc    │ │ engine       │  │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Three-Tier Rendering Pipeline (PDF)
```
File → PdfViewer (loads pdf.js document)
     → ScrollContainer (virtualizes pages, tracks visible set)
     → PageCanvas (renders each page to canvas, applies color LUT)
```

---

## 4. Project Structure

```
NocturaPDF/
├── .gitignore                  # Git ignore rules
├── eslint.config.js            # ESLint flat config (browser + electron rules)
├── index.html                  # Vite entry HTML (root mount + favicon)
├── LICENSE                     # MIT license
├── package.json                # Dependencies, scripts, electron-builder config
├── package-lock.json           # Locked dependency versions
├── README.md                   # Project documentation
├── vite.config.js              # Vite dev/build configuration
│
├── build/
│   ├── icon.ico                # Windows app icon (ICO format)
│   └── icon.png                # App icon (PNG format)
│
├── electron/
│   ├── main.cjs                # Electron main process — window, IPC, lifecycle
│   ├── menu.cjs                # Native menu builder — File/Edit/View/Help
│   ├── package.json            # Marks electron dir as CommonJS
│   └── ppreload.cjs            # Preload script — secure bridge (contextBridge)
│
├── public/
│   └── favicon.svg             # Browser tab favicon
│
└── src/
    ├── App.jsx                 # Root component — routing, state, orchestration
    ├── index.css               # Global CSS — fonts, color scheme, print rules
    ├── main.jsx                # React entry — mounts App to #root
    │
    ├── components/
    │   ├── common/             # Shared UI primitives
    │   │   ├── Button.jsx
    │   │   ├── IconButton.jsx
    │   │   ├── icons.jsx
    │   │   ├── Modal.jsx
    │   │   ├── PageShell.jsx
    │   │   └── Popover.jsx
    │   │
    │   ├── dialogs/            # Modal dialogs
    │   │   ├── AboutDialog.jsx
    │   │   ├── KeyboardShortcutsDialog.jsx
    │   │   └── PropertiesDialog.jsx
    │   │
    │   ├── layout/             # App chrome & site layout
    │   │   ├── AppMenu.jsx
    │   │   ├── SecondaryToolbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── SiteFooter.jsx
    │   │   ├── SiteHeader.jsx
    │   │   ├── TabBar.jsx
    │   │   └── TopAppBar.jsx
    │   │
    │   └── reader/             # PDF viewing surface
    │       ├── EmptyState.jsx
    │       ├── PageCanvas.jsx
    │       ├── PdfViewer.jsx
    │       ├── RecentFileCard.jsx
    │       ├── RecentFilesGrid.jsx
    │       └── ScrollContainer.jsx
    │
    ├── features/
    │   └── darkmode/
    │       └── darkmodeEngine.js   # Color remapping engine for PDF pages
    │
    ├── hooks/
    │   ├── useKeyboard.js      # Global keyboard shortcut hook
    │   ├── usePdfColorMode.js  # PDF content recoloring context
    │   ├── useRoute.js         # Minimal client-side router
    │   └── useUiTheme.js       # UI chrome theme context (light/dark/system)
    │
    ├── pages/
    │   ├── AboutPage.jsx       # Marketing "About" page
    │   ├── DevelopersPage.jsx  # Marketing "Developers" page
    │   ├── DownloadPage.jsx    # Marketing "Download" page
    │   ├── LandingPage.jsx     # Marketing landing page
    │   └── landing.css         # Landing page-specific CSS (hover, media queries)
    │
    ├── services/
    │   ├── recentFilesService.js # Recent-files CRUD + localStorage
    │   ├── settingService.js   # UI theme, color mode, sidebar prefs persistence
    │   └── storageService.js   # localStorage wrapper with JSON + prefix
    │
    ├── store/
    │   └── appstore.js         # Tab state (open tabs, active tab) via Context+useReducer
    │
    └── utils/
        ├── constants.js        # App constants (themes, color modes, scales)
        ├── formatters.js       # hexToRgb helper
        └── themeCssVars.js     # Maps theme → CSS custom properties
```

---

## 5. File-by-File Breakdown

### 5.1 Root Configuration Files

#### `package.json`
The project manifest. Contains:
- **Name/version:** `nocturapdf` v0.1.0
- **Scripts:**
  - `dev` → starts Vite dev server
  - `build` → production web build (outputs to `dist/`)
  - `lint` → runs ESLint
  - `electron` → launches Electron against the dev server
  - `electron:build` → packages Windows installer via electron-builder
- **Dependencies:** `pdfjs-dist`, `react`, `react-dom`
- **DevDependencies:** `electron`, `electron-builder`, `vite`, `eslint`, and plugins
- **Build config:** electron-builder uses appId `com.nocturapdf.app`, targets Windows NSIS installer with icon from `build/icon.ico`
- **Module type:** ESM (`"type": "module"`) — except electron files which use `.cjs`

#### `vite.config.js`
Configures Vite:
- Sets `base: "./"` — **critical for Electron**: relative asset paths let the built `dist/index.html` work when loaded via `file://` in a packaged app, not just from a server root
- Adds the React plugin for JSX transformation

#### `index.html`
The Vite entry HTML:
- Has a `<div id="root">` where React mounts
- Loads `/src/main.jsx` as a module
- Sets the favicon to `/favicon.svg`
- Title: "NocturaPDF"

#### `eslint.config.js`
Uses the modern ESLint **flat config** system. Key aspects:
- **Two config blocks:**
  1. `src/**` — browser environment, React hooks rules, JSX enabled
  2. `electron/**/*.cjs` — Node.js environment, CommonJS, ignores React rules
- Ignores `dist/`
- Custom rule: `no-unused-vars` with pattern to allow capitalized variables (component names)

#### `.gitignore`
Excludes `node_modules`, `dist`, `release` (electron-builder output), logs, env files, and editor directories.

#### `LICENSE`
MIT License — permissive open-source license.

### 5.2 Electron Layer

#### `electron/main.cjs`
The **Electron main process** — runs in Node.js, manages the app lifecycle. Key responsibilities:

1. **Window Creation** (`createWindow`):
   - 1280×800 initial size, 720×480 minimum
   - Dark background color `#16171d`
   - `autoHideMenuBar: true` — the app renders its own menu bar in React; native menu is hidden but still registered for keyboard accelerators
   - **Security settings:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — the renderer has zero Node.js access
   - Loads `dist/index.html` when packaged, or the Vite dev server (with retry logic) in development

2. **IPC Handlers** (all exposed to renderer via preload):
   - `read-file` — reads a file from disk, converts to array for transfer
   - `open-file-explorer` — reveals a file in the system file explorer
   - `open-external` — opens a URL in the default browser
   - `open-file-dialog` — native multi-file selection dialog, reads all selected PDFs
   - `save-file` — writes data to disk; shows "Save As" dialog if no path provided
   - `get-file-info` — returns file stats (size, dates, path) for the Properties dialog
   - `get-app-info` — returns app/runtime metadata (Electron/Chrome/Node versions) for the About dialog
   - `update-menu-state` — syncs document/recent-files state to the native menu

3. **Lifecycle:**
   - `app.whenReady()` → creates window, handles macOS "activate"
   - `window-all-closed` → quits except on macOS (standard pattern)

#### `electron/ppreload.cjs`
The **preload script** — the security-critical bridge between the main process and the renderer. Uses Electron's `contextBridge` API to expose a safe, minimal API surface:

```javascript
contextBridge.exposeInMainWorld("nocturaPdf", {
  isElectron: true,
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  saveFile: (data, filePath) => ipcRenderer.invoke("save-file", data, filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke("get-file-info", filePath),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),
  openFileExplorer: (filePath) => ipcRenderer.invoke("open-file-explorer", filePath),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  onMenuAction: (callback) => { ... },  // subscribes to native menu clicks
  updateMenuState: (patch) => ipcRenderer.invoke("update-menu-state", patch),
});
```

This design means:
- The renderer only sees `window.nocturaPdf` — a tiny, whitelisted API
- No direct `ipcRenderer` access from the renderer
- Context isolation keeps Node.js and Electron internals completely separate from the React app

#### `electron/menu.cjs`
Builds the **native application menu** (File/Edit/View/Help). Key details:

- **Module-level `menuState`** keeps track of `hasDoc`, `filePath`, and `recentFiles`
- **`updateMenuState(win, patch)`** merges new state and rebuilds the menu — called from the renderer via IPC whenever document state changes
- Menu items with accelerators send actions to the renderer via `mainWindow.webContents.send("menu:action", {...})` — the renderer listens and dispatches to the appropriate handler
- **Document-dependent items** (Save, Close, Print, Properties) are enabled/disabled based on `hasDoc`
- **File menu:** Open, Close, Open Recent (submenu), Show in Folder, Save, Save As, Print, Properties, Exit (Windows/Linux)
- **Edit menu:** Undo/Redo/Cut/Copy/Paste/Select All (standard roles), Find/Find Next/Find Previous
- **View menu:** Zoom controls, Fit to Width/Page, Actual Size, Rotate, Toggle Sidebar, Toggle Presentation, Fullscreen, Reload, DevTools
- **Help menu:** Visit Website, User Manual, Keyboard Shortcuts, Check for Updates, About
- **`checkForUpdates()`** — uses Node's `https` module to query the GitHub Releases API, compares versions, and shows a dialog if an update is available. Runs entirely in the main process.

#### `electron/package.json`
Minimal — just `{ "type": "commonjs" }` — forces CommonJS for all `.cjs` files in the electron directory, overriding the root ESM setting.

### 5.3 React Entry & Root

#### `src/main.jsx`
The React entry point. Mounts `<App />` inside `<StrictMode>` to the `#root` div. StrictMode enables double-rendering in development to catch side effects.

#### `src/App.jsx` (835 lines — the largest file)
The **root component** that orchestrates everything. Key responsibilities:

**Providers:**
- `UiThemeProvider` — UI chrome theme (light/dark/system)
- `PdfColorModeProvider` — PDF content recoloring
- `AppStoreProvider` — tab state

**Routing (AppRoot):**
- Uses custom `useRoute` hook for minimal routing
- Path routes:
  - `/` → LandingPage (marketing site)
  - `/about` → AboutPage
  - `/developers` → DevelopersPage
  - `/download` → DownloadPage
  - `/app` → Shell (the PDF reader) with `showHomeView=false`
  - `/home` → Shell with `showHomeView=true` (shows EmptyState)
  - **Electron directly enters the Shell** — skips landing page entirely
- **`isElectron` flag** detected from `window.nocturaPdf?.isElectron`

**Shell Component (the reader):**
- **State:** zoomFactor, fitMode, currentPage, numPages, pdfDoc, scrollRequest, rotation, sidebarCollapsed, focusMode, presentationMode, isFullscreen, searchOpen, recentFiles, and dialog states
- **Tab reset pattern:** When `activeTabId` changes, resets all derived reader state during render (React's documented "adjusting state when a prop changes" pattern) — pure reset, no effect needed
- **Fullscreen sync:** Tracks `document.fullscreenElement` to stay in sync with native fullscreen (Esc can exit outside handlers)
- **File opening:**
  - Electron → native file dialog via `window.nocturaPdf.openFileDialog()`
  - Browser → hidden HTML `<input type="file">`
  - Both support multiple file selection → each opens in its own tab
- **Thumbnail generation:** On document load, renders first page to a canvas at 20% scale, converts to base64 JPEG, saves to recent files
- **Recent files:** Add/remove/clear via `recentFilesService`
- **Keyboard shortcuts:** Wired via `useKeyboard` hook
- **Native menu action listener:** `useEffect` subscribes to `menu:action` events from the native menu and dispatches to appropriate handlers via a switch statement
- **Menu state sync:** Pushes `hasDoc`, `filePath`, and `recentFiles` to the native menu via `updateMenuState`
- **Focus/Presentation mode:** Both hide TopAppBar and SecondaryToolbar; Presentation also requests fullscreen
- **Search:** Currently a placeholder (disabled input showing "Search (coming soon)")
- **CSS Variables:** Computes `themeToCssVars(resolvedTheme)` and applies to root div style — this themes the entire app

### 5.4 Components — Common

#### `src/components/common/Button.jsx`
A styled text-label button with variants:
- `default` — bordered with active state
- `ghost` — transparent background with subtle active state
- Uses CSS variables (`--border`, `--accent-bg`, etc.) for theming
- 13px font, 6px border radius, inline-flex layout

#### `src/components/common/IconButton.jsx`
Icon-only button with:
- Consistent 32px hit-target size
- Required `aria-label` prop (enforced at call sites)
- Active state with accent background
- Used throughout toolbars

#### `src/components/common/icons.jsx`
**Hand-rolled SVG icon set** (no icon library dependency):
- Base `Icon` wrapper — 18×18 SVG with stroke-based (Feather-style) icons
- Icons include: Sun, Moon, Monitor, Maximize, Minimize, Sidebar, ChevronLeft/Right, Plus, Search, Zoom In/Out, FitWidth, FitPage, Menu, X
- Feature-card icons for landing page: Offline, NoAccount, Instant, Minimal, Speed, Focus

#### `src/components/common/Modal.jsx`
Reusable modal dialog:
- Renders centered card over dimmed backdrop when `open`
- **Escape key** closes it (stopping propagation to avoid conflict with other handlers)
- Backdrop click closes it; clicking inside the card does not
- Configurable title and max width (default 480px)
- Scrollable content (max-height 85vh)
- Proper ARIA roles (`role="dialog"`, `aria-modal="true"`)

#### `src/components/common/PageShell.jsx`
Wrapper for marketing pages (About, Developers, Download):
- Renders `SiteHeader` at top, `SiteFooter` at bottom
- Centers content in a 720px column with proper padding
- Ensures consistent look across all public pages

#### `src/components/common/Popover.jsx`
Lightweight anchored popover for menus:
- Renders children below the trigger element
- Closes on outside click or Escape
- Not a full modal — no backdrop or focus trap (deliberate for menus)
- Configurable alignment (left/right) and width

### 5.5 Components — Layout

#### `src/components/layout/TopAppBar.jsx`
The **main application bar** with three zones:
- **Left:** Logo home button + File/Edit/View/Help dropdown menus
- **Center:** TabBar (document tabs + open button)
- **Right:** UI theme toggle (Light/Dark/System cycle) + Fullscreen toggle

Menu definitions include:
- **File:** Open, Close, Open Recent (dynamic submenu), Show in Folder, Save, Save As, Print, Properties — with conditional disabling based on `hasDoc`/`isElectron`
- **Edit:** Undo/Redo/Cut/Copy/Paste/Select All via `document.execCommand`, Find/Find Next/Find Previous
- **View:** Zoom In/Out/Reset, Fit to Width/Page, Actual Size, Rotate, Toggle Sidebar, Toggle Presentation, Fullscreen
- **Help:** Visit Website, User Manual, Keyboard Shortcuts, Check for Updates, About — "Check for Updates" disabled in browser mode

Uses `AppMenu` + `Popover` for the dropdown menus, `IconButton` for icon controls.

#### `src/components/layout/SecondaryToolbar.jsx`
The **utility bar** below the tab strip:
- **Sidebar toggle button**
- **Page navigation:** prev/next buttons + editable page number input
- **Zoom controls:** zoom out, percentage display (click to reset), zoom in
- **Fit mode:** Fit Width and Fit Page buttons
- **Search button** (opens placeholder)
- **PDF color modes** (off/smart/pure/sepia) — right-aligned, always visible
- Only renders document-dependent controls when a doc is open (`hasDoc`)

#### `src/components/layout/Sidebar.jsx`
The collapsible sidebar (220px wide) with two modes:

**Pages (Thumbnails) mode:**
- Renders a page thumbnail for every page
- Each `Thumbnail` renders via pdf.js with **IntersectionObserver-based virtualization** — only visible thumbnails actually render to canvas
- Active page highlighted with accent border
- Clicking a thumbnail jumps to that page

**Outline mode:**
- Fetches document outline via `pdfDoc.getOutline()`
- Recursive render for nested bookmarks
- Clicking an outline item resolves the destination and jumps to the page

**Virtualization:** Uses `IntersectionObserver` with `rootMargin: "100% 0px"` to track which thumbnails are visible — a 300-page document doesn't render 300 canvases eagerly.

#### `src/components/layout/TabBar.jsx`
Document tabs bar:
- One tab per open PDF + trailing "+" button to open another
- Tabs shrink together (flex layout) down to `TAB_MIN_WIDTH: 44px` instead of scrolling horizontally
- Max width 200px per tab, with ellipsis truncation for long filenames
- Active tab highlighted with `--code-bg` background
- Close button ("×") per tab with `stopPropagation`

#### `src/components/layout/SiteHeader.jsx` / `SiteFooter.jsx`
Shared navigation for marketing pages:
- **Header:** Logo, nav links (Home/About/Developers/Download), "Get App" button
- Grid layout: 1fr auto 1fr (branding left, nav center, CTA right)
- **Footer:** Copyright + "Get App" link
- Both use `onNavigate` callback (the custom router's navigate function)

### 5.6 Components — Reader

#### `src/components/reader/PdfViewer.jsx`
Owns the **PDF document lifecycle**:
- Configures pdf.js worker: `GlobalWorkerOptions.workerSrc = pdfWorkerUrl`
- Uses `pdfjs-dist/legacy/build/pdf.mjs` for broader compatibility
- **Document loading:** accepts `File`, URL string, `Uint8Array`, or `ArrayBuffer`
  - File → converts to `Uint8Array` via `file.arrayBuffer()`
  - URL string → loads via URL
- **Lifecycle management:**
  - Destroys previous document when replaced (prevents memory leaks)
  - Marks the effect with `cancelled` flag to handle unmount races
  - Calls `onDocumentLoad` and `onNumPagesChange` callbacks
- **Loading/error states:** shows "Loading PDF…" and error messages
- Only renders `ScrollContainer` when `pdfDoc` and `numPages > 0`
- Destroys pdf.js document on unmount

#### `src/components/reader/ScrollContainer.jsx`
The **scroll viewport with virtualization**:

- **Container measurement:** `ResizeObserver` tracks container width (for fit-to-width) and viewport height (for fit-to-page)
- **Ctrl+scroll zoom:** wheel listener with `preventDefault` — blocks native page zoom, adjusts zoomFactor by ±0.1
- **Page virtualization:** Single `IntersectionObserver` with `rootMargin: "150% 0px"` (preloads ~1.5 viewports above/below)
  - Mounts a lightweight wrapper div per page
  - Only pages intersecting the viewport have `PageCanvas` actually render pixels
  - `visiblePages` is a `Set` of page numbers, tracked with `useState`
- **Current page tracking:** The observer also computes which page is at the top of the viewport and calls `onCurrentPageChange`
- **Imperative scrolling:** `scrollRequest` prop triggers `scrollIntoView({behavior: "smooth"})` on the target page element — used by sidebar thumbnails, outline clicks, and page number input
- **Layout:** Column of pages, centered, max-width 900px, 16px gap between pages, 12px side padding

#### `src/components/reader/PageCanvas.jsx`
The **core page rendering component** — one instance per page:

**Key design: Raw pixel cache + theme reapplication**
1. **Probe size** (always runs): fetches page via pdf.js, gets unscaled viewport dimensions to reserve scroll space
2. **Scale calculation:** Derived per-page from containerWidth/zoomFactor/fitMode:
   - `fitMode="width"`: `(containerWidth * zoomFactor) / pageWidth`
   - `fitMode="page"`: `min(widthRatio, heightRatio) * zoomFactor`
   - Clamped between MIN_SCALE (0.25) and MAX_SCALE (4)
3. **Render (when visible):**
   - Calls `page.render()` from pdf.js → renders to canvas
   - **Caches raw ImageData** (undarkened pixels) in `rawImageDataRef`
   - Applies color LUT via `applyTheme(cloneImageData(raw), lut, colorMode.mode)` if color mode is active
4. **Color mode changes:** A separate effect reapplies the theme from cached raw pixels — **no pdf.js re-render needed**. This makes theme switching instant.
5. **Visibility teardown:** When scrolled out of view:
   - Cancels any in-progress render task
   - Clears raw cache (a page's ImageData is multiple MB)
   - Sets canvas width/height to 0 (transparent repaint — background shows through)
   - Re-renders from pdf.js on scroll back into view

The comment in the code explains an important detail: memory management — keeping raw pixels for every page of a 300-page document would exhaust memory.

#### `src/components/reader/EmptyState.jsx`
The **start screen** when no document is open:
- **Fewer than 5 recent files:** Centered "Open a PDF" button with dashed border, hover effects (border color/background transition)
- **5+ recent files:** Shows a "Recently Opened" section with:
  - CSS grid (`repeat(auto-fill, minmax(160px, 1fr))`)
  - Open button as a grid item
  - Recent file cards as other grid items

#### `src/components/reader/RecentFileCard.jsx`
Displays a single recent file:
- **Thumbnail area:** Shows the stored image URL (base64 data URL) as background, or a 📄 emoji placeholder
- **File info:** Name (with ellipsis), "time ago" label computed once on mount via lazy useState
- **Remove button:** Appears on hover (opacity 0→1), turns red on hover, uses `stopPropagation`
- Clicking the card calls `onOpenFile(recentFile)`

#### `src/components/reader/RecentFilesGrid.jsx`
Simple container that renders recent file cards in a grid with a heading. Currently not directly used by App.jsx (EmptyState inlines the grid), but kept as a reusable component.

### 5.7 Components — Dialogs

#### `src/components/dialogs/AboutDialog.jsx`
Shows app info:
- Fetches app metadata from Electron via `window.nocturaPdf.getAppInfo()` when open
- Displays: name, version, description, author, license
- In Electron, also shows: Electron version, Chrome version, Node.js version, platform/arch
- Links to the website (opens externally in Electron, new tab in browser)
- Falls back to hardcoded defaults if Electron API unavailable

#### `src/components/dialogs/KeyboardShortcutsDialog.jsx`
Lists all keyboard shortcuts, grouped by category:
- **File:** Open (Ctrl+O), Close Tab (Ctrl+W), Save (Ctrl+S), Save As (Ctrl+Shift+S), Print (Ctrl+P), Properties (Alt+Enter), Exit (Ctrl+Q)
- **Edit:** Undo, Redo, Cut, Copy, Paste, Select All, Find, Find Next, Find Previous
- **View:** Zoom In/Out/Reset, Fullscreen, Focus Mode
- **Navigation:** Arrow keys, Space, Shift+Space, Escape
- Platform-aware: shows ⌘ vs Ctrl on macOS
- Uses `<kbd>` elements styled with monospace font

#### `src/components/dialogs/PropertiesDialog.jsx`
Shows **document properties**:
- Fetches OS file info (size, dates, path) via `window.nocturaPdf.getFileInfo()` when in Electron
- Fetches PDF metadata via `pdfDoc.getMetadata()` from pdf.js
- **General section:** filename, location, size (formatted bytes), page count, created/modified dates
- **PDF Metadata section:** title, author, subject, keywords, creator, producer, PDF version, creation/modification dates
- Handles both pdf.js metadata object formats (Map-like or plain object)
- Cancellation flag prevents state updates after unmount

### 5.8 Features

#### `src/features/darkmode/darkmodeEngine.js`
The **color remapping engine** — the heart of the PDF dark mode feature:

**`buildLightnessLUT(theme)`** — builds a 256-entry lookup table:
- Maps input luma (0=black to 255=white) to output luma
- White paper pixels → theme's dark background
- Black text pixels → theme's light foreground
- **"aggressive" mode** (used by "pure" theme): steepens the curve around midpoint via `clamp01((t - 0.5) * 1.6 + 0.5)` for stronger contrast
- Uses relative luminance formula: `0.299R + 0.587G + 0.114B` (Rec. 601)

**`getThemeLut(theme)`** — memoized per theme ID:
- Uses a `Map` cache — themes are only built once for the app's lifetime
- Returns `null` when theme is "off" (no recoloring)

**`applyTheme(imageData, lut, themeMode)`** — the pixel processing function:
- Iterates each pixel (RGBA), processes RGB channels
- Computes old luma, looks up new luma from LUT
- **For achromatic pixels** (saturation=0): sets all channels to newLuma (direct swap)
- **For chroma pixels** (figures, charts, highlights): uses **HSL reconstruction**:
  - Extract hue/saturation via `rgbToHueSat`
  - Reconstruct RGB from new lightness + original hue/saturation
  - This avoids the "rainbow fringe" problem of simple ratio scaling (as documented in the code comment)
- **"warm" mode** (sepia): adds +18 to red, -18 to blue on every pixel
- Mutates and returns the same ImageData (callers clone if source must stay untouched)

### 5.9 Hooks

#### `src/hooks/useKeyboard.js`
Global keyboard shortcut handler:
- **`isTypingTarget(el)`** — checks if the active element is input/textarea/select/contentEditable; skips all shortcuts except Escape when typing
- **Supported shortcuts:**
  - Ctrl+Z + / = → Zoom In
  - Ctrl+- → Zoom Out
  - Ctrl+0 → Reset Zoom
  - Ctrl+F → Open search
  - Ctrl+O → Open file
  - Ctrl+W → Close tab
  - Ctrl+Shift+S → Save As
  - Ctrl+S → Save
  - Ctrl+P → Print
  - Alt+Enter → Properties
  - F11 → Fullscreen
  - F3 → Find Next, Shift+F3 → Find Previous
  - Ctrl+Shift+] → Rotate CW
  - Ctrl+Shift+[ → Rotate CCW
  - F (no modifier) → Toggle Focus Mode
  - Escape → Exit focus/presentation/search
  - Arrows/Space → Page navigation
- Attaches a single `keydown` listener on window
- `preventDefault()` on all handled shortcuts

#### `src/hooks/useUiTheme.js`
UI chrome theme context:
- **States:** `light`, `dark`, `system`
- **`useSystemPrefersDark()`** — tracks `window.matchMedia("(prefers-color-scheme: dark)")`, listens for changes
- **Resolution logic:** If `system`, resolves to `dark`/`light` based on OS preference
- **Persistence:** Saves to localStorage via `settingService.setUiTheme()`
- Exposes: `uiThemeId`, `resolvedThemeId`, `resolvedTheme`, `setUiThemeId`, `uiThemes`
- Uses `React.createElement` (not JSX) in a plain `.js` file

#### `src/hooks/usePdfColorMode.js`
PDF content recoloring context:
- **States:** `off`, `smart`, `pure`, `sepia`
- Computes the LUT via `getThemeLut(colorMode)` wrapped in `useMemo`
- **Completely decoupled** from UI theme (useUiTheme) — recoloring the PDF content is a separate concern from recoloring the chrome
- Defaults to "off" so the reading surface is pristine unless the user opts in
- Persists via `settingService.setPdfColorMode()`
- Uses `React.createElement` (no JSX) in plain `.js`

#### `src/hooks/useRoute.js`
Minimal client-side router:
- Just the **History API** + `popstate` listener
- Only two real destinations: `/` (landing) and `/app` (reader)
- No react-router dependency — deliberate minimalism
- `navigate(to)` uses `history.pushState` + state update
- Returns `[path, navigate]`

### 5.10 Store

#### `src/store/appstore.js`
Tab-level state via React Context + `useReducer`:
- **Reducer actions:**
  - `OPEN_TAB` → adds a new tab with a UUID, sets it active
  - `CLOSE_TAB` → removes tab, picks fallback active tab (same index, or previous)
  - `SET_ACTIVE_TAB` → changes active tab
- **`nextId()`** — uses `crypto.randomUUID()` with a fallback for older environments
- **Selectors:** `activeTab` derived by finding tab matching `activeTabId`
- Exposes: `tabs`, `activeTabId`, `activeTab`, `openTab`, `closeTab`, `setActiveTab`
- Uses `React.createElement` (no JSX) in plain `.js`

### 5.11 Services

#### `src/services/storageService.js`
Minimal localStorage wrapper:
- **Prefix:** all keys stored as `nocturapdf:${key}` — prevents collisions with other apps
- `get(key, fallback)` — parses JSON, returns fallback on any error (including quota, private mode)
- `set(key, value)` — serializes to JSON, silently ignores errors

#### `src/services/settingService.js`
High-level settings persistence:
- `getUiTheme` / `setUiTheme` — UI theme preference
- `getPdfColorMode` / `setPdfColorMode` — PDF color mode preference
- `getSidebarCollapsed` / `setSidebarCollapsed` — sidebar state (defaults to **collapsed** per the reading-first layout)

#### `src/services/recentFilesService.js`
Recent-files management:
- **`addRecentFile(file, thumbnail, filePath)`**:
  - Deduplicates by filename (removes existing, adds new to top)
  - Creates entry with: id, name, size, thumbnail (base64), openedAt, optional filePath
  - Caps at `MAX_RECENT_FILES = 10`
  - Returns updated list
- **`getRecentFiles()`** — reads from storage, defaults to `[]`
- **`clearRecentFiles()`** — clears all
- **`removeRecentFile(fileId)`** — removes by ID
- All methods wrap in try/catch and gracefully degrade

### 5.12 Utils

#### `src/utils/constants.js`
Central constants file:
- **`UI_THEMES`** — light/dark with bg/fg/accent colors (these are UI chrome colors)
- **`ACCENT_HOVER`** — hover state accent color
- **`UI_THEME_ORDER`** — `["light", "dark", "system"]`
- **`DEFAULT_UI_THEME_ID`** — `"system"`
- **`PDF_COLOR_MODES`** — off/smart/pure/sepia with their LUT targets (bg/fg) and modes (`preserve`/`aggressive`/`warm`)
- **`PDF_COLOR_MODE_ORDER`** — order for toolbar display
- **`DEFAULT_PDF_COLOR_MODE_ID`** — `"off"`
- **`MIN_SCALE`** = 0.25, **`MAX_SCALE`** = 4, **`ZOOM_STEP`** = 0.1
- **`VIRTUALIZATION_BUFFER_PAGES`** = 2

#### `src/utils/formatters.js`
- **`hexToRgb(hex)`** — converts hex color to `{r, g, b}` object; handles 3-digit shorthand and 6-digit formats

#### `src/utils/themeCssVars.js`
- **`themeToCssVars(resolvedTheme)`** — converts a UI theme to CSS custom properties:
  - `--bg` → theme background color
  - `--text` → rgba(fg, 0.75)
  - `--text-h` → fg (high contrast)
  - `--border` → rgba(fg, 0.14)
  - `--code-bg` → rgba(fg, 0.06)
  - `--accent`, `--accent-hover`, `--accent-bg`, `--accent-border` → accent colors
- These variables are applied inline on the app root, making the entire component tree themeable

### 5.13 Pages

#### `src/pages/LandingPage.jsx`
The marketing landing page:
- **Hero:** Bold headline "A dark, focused space for long reads.", subtext, two CTAs: "Start Reading in Browser" and "Get App"
- **Features grid:** 6 feature cards (Always Free, No Account Required, Instant Access, Minimal Interface, Fast Performance, Distraction Free) with SVG icons
- Uses `SiteHeader` and `SiteFooter`
- Imports `landing.css` for hover states and responsive grid

#### `src/pages/AboutPage.jsx`
Content page explaining:
- The product philosophy ("built for reading, not for managing files")
- Why NocturaPDF exists (against feature bloat)
- What it offers today
- Who it's for (students, professionals)
- Vision for the future

#### `src/pages/DevelopersPage.jsx`
Technical overview for developers:
- Stack overview
- Electron architecture (main/renderer/preload)
- Performance philosophy (minimal deps, fast startup, no tracking)
- Open source contribution guide
- Design philosophy (simplicity, performance, clarity, consistency)

#### `src/pages/DownloadPage.jsx`
Download page:
- CTA button linking to GitHub Releases (uses `/releases` not `/releases/latest` — avoids 404 before first release)
- Key features list
- System requirements: Windows 10+, ~200MB, no internet needed
- Alternative: "Start reading in browser" link to `/app`

### 5.14 Styles

#### `src/index.css`
Global styles:
- **CSS variables:** text colors, background, accent, border, font stacks, shadow
- **Responsive font:** 18px base, 16px under 1024px
- **Font smoothing** and antialiasing
- **Print styles:** hides all app chrome, shows only PDF canvases, one per page (`page-break-after: always`)
- Body reset, root flex layout

#### `src/pages/landing.css`
Landing page-specific CSS (what inline styles can't express):
- `.np-btn-primary` hover state (background/border transition)
- `.np-features-grid` — responsive 3/2/1 column grid via media queries
- `.np-feature-card` hover effects (translate, box-shadow, border color)

---

## 6. Key Implementation Details

### 6.1 The Dark Mode Engine (Pixel-Level PDF Recoloring)

The most sophisticated part of the app is `darkmodeEngine.js`. Here's the technical breakdown:

**The Problem:** PDF pages are rendered as white-with-black-text canvases. Simply inverting colors looks terrible. Applying a CSS filter distorts colors unpredictably. The image needs pixel-level processing.

**The Solution:** A **lightness LUT (Look-Up Table)** approach:

1. **Build a 256-entry LUT** mapping input luma (0–255) to output luma:
   - White paper (luma ≈ 255) → dark theme background
   - Black text (luma ≈ 0) → light foreground text
   - Grays in between smoothly interpolate

2. **Process each pixel:**
   - Compute relative luminance: `0.299R + 0.587G + 0.114B`
   - Look up the new luma from the LUT
   - **Achromatic pixels** (saturation = 0) → set all channels to new luma
   - **Chromatic pixels** (figures, highlights) → HSL reconstruction:
     - Extract original hue/saturation
     - Rebuild RGB from new lightness + original hue/saturation
     - This preserves colors while adjusting brightness — no "rainbow fringe" on anti-aliased text edges

3. **Modes:**
   - `preserve` (Smart) — smooth luma mapping
   - `aggressive` (Pure) — steepened contrast curve for stronger dark mode
   - `warm` (Sepia) — adds +18 red bias, -18 blue bias for warm "sepia" feel

4. **Caching & Performance:**
   - Raw (undarkened) pixels are cached per page after first render
   - Theme changes simply re-process the cached raw pixels — **no pdf.js re-render**
   - LUTs are memoized per theme — built once, reused forever
   - Caches are dropped when pages scroll out of view to save memory

### 6.2 Page Virtualization

For a 300-page document, rendering every page to canvas would be catastrophic for memory and performance. The solution is **IntersectionObserver-based virtualization**:

1. **ScrollContainer** mounts a lightweight wrapper div per page (cheap)
2. A single `IntersectionObserver` with `rootMargin: "150% 0px"` watches all page elements
3. Only pages intersecting (or within 1.5 viewports of) the viewport get added to `visiblePages` Set
4. **PageCanvas** only calls `page.render()` when `isVisible` is true
5. Scrolling out of view tears down: cancels renders, clears pixel caches, resets canvas

**Result:** Only ~3-6 pages are ever fully rendered at once, regardless of document length.

### 6.3 Two-Layer Theming

The app separates **useInterface theming** from **content theming**:

| Layer | Context | What it affects | Properties |
|-------|---------|----------------|------------|
| UI Chrome | `useUiTheme` | Toolbars, sidebar, menus, dialogs | `--bg`, `--text`, `--border`, etc. via CSS vars |
| PDF Content | `usePdfColorMode` | The PDF page pixels themselves | Pixel LUT processing on canvas |

This separation means:
- You can have a light UI but dark PDF pages (or vice versa)
- The UI theme never distorts the document
- Default: PDF color mode is "off" (pristine document), UI defaults to "system"

### 6.4 Electron ↔ Renderer Communication

```
Native Menu (menu.cjs)
  │  user clicks menu item
  ▼
mainWindow.webContents.send("menu:action", {action: "save", ...})
  │
  ▼
Preload (ppreload.cjs) — relays to renderer via onMenuAction callback
  │
  ▼
App.jsx — switch(action) dispatches to handler (handleSave, handleZoomIn, etc.)
  │
  ▼
State updates → UI re-renders

Renderer → Main (file operations):
App.jsx → window.nocturaPdf.readFile(path)
  │         (invokes IPC "read-file")
  ▼
main.cjs → fs.readFile(path) → returns {success, data}
  │
  ▼
App.jsx → creates File object and opens tab
```

**State sync:** The renderer pushes `hasDoc`, `filePath`, and `recentFiles` to the native menu whenever they change, so menu items enable/disable correctly and the Open Recent submenu stays in sync.

### 6.5 Electron Detection & Dual-Runtime Design

The same React codebase runs in browser and Electron:

```javascript
const isElectron = typeof window !== "undefined" && Boolean(window.nocturaPdf?.isElectron);
```

- **Browser:** `window.nocturaPdf` is undefined → falls back to HTML file input, no file path support, opens external links in new tabs
- **Electron:** `window.nocturaPdf` exists → uses native dialogs, reads/writes files directly, opens in file explorer, hooks into native menu

The **routing difference:** In Electron, `path` is never `/app`, so the app bypasses the landing page and opens directly into the reader shell.

### 6.6 Tabs Architecture

Each tab holds a `File` object (plus a `path` property when in Electron). The key detail:

- `PdfViewer` is keyed by `tab.id` — so switching tabs unmounts the old viewer and mounts a new one
- Each tab's pdf.js document is loaded independently
- State resets (zoom, currentPage, rotation, etc.) happen via the "adjusting state when a prop changes" pattern when `activeTabId` changes

---

## 7. Software Engineering Principles

### 7.1 Separation of Concerns
- **Electron main process** (file I/O, window lifecycle) ↔ **Renderer** (UI) ↔ **Preload** (bridge) are cleanly separated
- **PDF pipeline** broken into three layers: `PdfViewer` (load) → `ScrollContainer` (virtualize) → `PageCanvas` (render)
- **Chrome theming** (`useUiTheme`) and **content theming** (`usePdfColorMode`) are separate contexts
- **Services** abstract storage details; components never touch localStorage directly

### 7.2 Component Composition
- Reusable primitives: `Button`, `IconButton`, `Modal`, `Popover`, `PageShell`
- Composition over inheritance: `EmptyState` uses `RecentFileCard`; `TopAppBar` uses `AppMenu` → `Popover` + `Button`; `PageShell` uses `SiteHeader` + `SiteFooter`

### 7.3 Custom Hooks for Logic Reuse
- `useKeyboard` — global shortcut handling in one place
- `useUiTheme` / `usePdfColorMode` — context providers that encapsulate persistence + resolution logic
- `useRoute` — router as a hook

### 7.4 Clean Code Practices
- **Comments explain *why*, not *what*** — e.g., the color algorithm comment explains *why* HSL reconstruction instead of ratio scaling
- **Constants extracted** — `constants.js` centralizes numeric values (zooms, scales, theme definitions)
- **Error handling** — IPC handlers wrap in try/catch, services degrade gracefully, effects use `cancelled` flags
- **Accessibility** — `aria-label` required on icon buttons, `<kbd>` for shortcuts, semantic `role="dialog"`
- **Security** — context isolation, sandboxing, no nodeIntegration

### 7.5 Performance-First Design
- **Virtualization** via IntersectionObserver (both pages and thumbnails)
- **LUT caching** (per-theme) — built once
- **Raw pixel caching** (per-page) — instant theme switching, no re-render
- **Memory teardown** on scroll-away
- **Minimal dependencies** — no react-router, no state library, no CSS framework, no icon library
- **`VITE_BASE=./`** — enables `file://` loading in packaged app

### 7.6 Dual-Target Architecture
The same codebase targets both browser and desktop:
- Feature detection via `isElectron` instead of platform branching
- Browser fallbacks (HTML input) for every Electron API
- Shared reading engine — only the file-access layer differs

---

## 8. Data Flow & State Management

### State Categories

| State | Managed By | Persistence |
|-------|-----------|-------------|
| UI Theme | `useUiTheme` Context | localStorage |
| PDF Color Mode | `usePdfColorMode` Context | localStorage |
| Open Tabs | `useAppStore` Context + reducer | In-memory only |
| Reader state (zoom, page, rotation) | `useState` in Shell | In-memory |
| Recent Files | `recentFilesService` | localStorage |
| Sidebar collapsed | `useState` + `settingService` | localStorage |
| Fullscreen/Focus/Presentation | `useState` | In-memory |

### Data Flow Example: Opening a PDF

```
User clicks "Open" →
  TopAppBar → onAddTab → handleOpenFileDialog (App.jsx)
    ↓
  Electron? → window.nocturaPdf.openFileDialog() → returns file data
  Browser?  → fileInputRef.current.click() → <input type="file">
    ↓
  File object created (with .path in Electron)
    ↓
  handleOpenFile → openTab(file, name) → store dispatch OPEN_TAB
    ↓
  AppStore state updates: tabs + [new], activeTabId = new
    ↓
  activeTab changes → Shell detects resetForTabId !== activeTabId
    → resets zoom/page/rotation state
    ↓
  <PdfViewer key={activeTab.id} file={activeTab.file} ...>
    → loadPdf() → pdfjs getDocument() → setPdfDoc
    → ScrollContainer mounts
    → IntersectionObserver triggers visible pages
    → PageCanvas renders page to canvas
    ↓
  handleDocumentLoad called → generates thumbnail → addRecentFile
    ↓
  recentFiles updated → EmptyState grid / Open Recent menu updates
```

### Data Flow Example: Theme Switching

```
User clicks theme icon →
  TopAppBar → cycleUiTheme() → setUiThemeId(next)
    ↓
  useUiTheme.setUiThemeId → setUiTheme(id) → localStorage.setItem
    → resolvedTheme recomputes (system → dark/light based on media query)
    ↓
  Shell's useMemo themeToCssVars(resolvedTheme) re-runs
    → new CSS variables applied to root div style
    ↓
  All components using var(--bg), var(--text), etc. re-render with new theme
```

### Data Flow Example: Color Mode Change

```
User clicks "Dark" in SecondaryToolbar →
  onColorModeChange("smart") → usePdfColorMode.setColorModeId
    → setPdfColorMode("smart") → localStorage
    → colorMode = PDF_COLOR_MODES["smart"]
    → lut = useMemo(() => getThemeLut(colorMode)) → returns LUT
    ↓
  lut/colorMode props change on PdfViewer → ScrollContainer → PageCanvas
    ↓
  PageCanvas's color-mode effect re-runs:
    raw = rawImageDataRef.current (cached pixels)
    ctx.putImageData(applyTheme(cloneImageData(raw), lut, "preserve"))
    → instant recap color without re-rendering from pdf.js
```

---

## 9. Performance Optimizations

| Optimization | Where | How it works |
|-------------|-------|-------------|
| **Page virtualization** | ScrollContainer | Only ~3-6 pages rendered at once via IntersectionObserver |
| **Thumbnail virtualization** | Sidebar | Same technique for page thumbnails |
| **Raw pixel caching** | PageCanvas | Theme changes re-process cache, not re-render |
| **LUT memoization** | darkmodeEngine | LUT built once per theme, cached in Map |
| **Immediate scroll-height reservation** | PageCanvas | Page size probed on mount — no layout jumps |
| **Clamped zoom** | PageCanvas | 0.25×–4× prevents extreme memory use |
| **Memory teardown** | PageCanvas | Caches dropped when pages scroll away |
| **Minimal dependencies** | package.json | Only 3 runtime deps — loading is fast |
| **No background compute** | — | No analytics, no tracking, no background workers |
| **CSS variable theming** | themeCssVars | Repaint-based theming, no DOM traversal |
| **Inline styles** | Everywhere | Avoids CSS cascade overhead; is direct binding to element style |
| **Canvas `alpha: false`** | PageCanvas/Sidebar | Opaque canvas context — faster compositing |

---

## 10. Security Considerations

### Electron Security Best Practices (Implemented)

| Practice | Implementation |
|----------|---------------|
| **Context isolation** | `contextIsolation: true` in webPreferences |
| **No node integration** | `nodeIntegration: false` |
| **Sandboxing** | `sandbox: true` |
| **Preload bridge** | Only exposes whitelisted APIs via `contextBridge` |
| **No remote content** | App is 100% local — loads dist/index.html or dev server |
| **CSP** | No remote script loading (not explicitly configured, but no remote resources used) |
| **Path validation** | IPC handlers check for valid file paths before I/O |

### The Security Model
The React renderer has **zero direct access** to Node.js or Electron APIs. All file operations go through the preload bridge, which invokes IPC handlers on the main process. The main process validates inputs and handles errors. This is the recommended Electron security architecture.

---

## 11. Build & Deployment

### Development Workflow
```bash
# Terminal 1: Web dev server with HMR
npm run dev              # → http://localhost:5173

# Terminal 2: Electron (loads from dev server)
npm run electron
```

### Production Build
```bash
# Web build → dist/
npm run build

# Desktop installer → release/
npm run electron:build
```

### electron-builder Configuration (from package.json)
- **appId:** `com.nocturapdf.app`
- **Product name:** NocturaPDF
- **Packaged files:** `dist/**/*` + `electron/**/*`
- **Windows target:** NSIS installer
- **Icon:** `build/icon.ico`
- Output: `release/`

### The `vite.config.js` `base: "./"` Decision
This is critical for Electron. When the app is packaged, Electron loads `dist/index.html` via `file://`. With absolute paths (default `base: "/"`), the browser would look for assets at the filesystem root. With `base: "./"`, all asset paths are relative to the HTML file, so the app works from anywhere on disk.

---

## 12. Talking Points for Your Presentation

### Opening (~30 seconds)
> "NocturaPDF is an offline-first PDF reader built for long reading sessions. It started with one question: **'What does someone actually need while reading a long document late at night — and what can we leave out?'** The answer is a minimal, dark, focused reader that runs in the browser and as a Windows desktop app, sharing the same reading engine."

### The Tech Stack (~60 seconds)
> "We use **React 19** for the UI, **pdf.js (pdfjs-dist)** for PDF rendering — the same library Firefox uses — and **Electron** to package it as a desktop app. Build tooling is **Vite**, with **electron-builder** for the Windows installer. Deliberately minimal: no TypeScript, no CSS framework, no state library, no icon library. Three runtime dependencies total."

### The Most Interesting Technical Aspect (~120 seconds)
> "The most interesting part is the **PDF dark mode engine**. Most PDF readers apply a CSS filter like `invert()` to make pages dark — which completely distorts colors. Our engine does **pixel-level processing**: we build a 256-entry lookup table mapping input luminance to output luminance, so white paper lands on our dark background and black text lands on light foreground. For colored pixels (figures, charts), we do **HSL reconstruction** — keeping original hue and saturation, only adjusting lightness. We also cache the raw page pixels, so switching themes is **instant** — we just re-process the cache, no re-rendering from pdf.js."

### The Virtualization (~60 seconds)
> "We use **IntersectionObserver-based virtualization**. A 300-page document could mean 300 full-size canvases in memory — instead, we only render the pages near the viewport (plus a 1.5-viewport preload buffer). When pages scroll away, we tear down their canvases and pixel caches to reclaim memory. At any moment, only about 3-6 pages are actually rendered."

### The Architecture (~60 seconds)
> "The architecture is cleanly separated. The **Electron main process** handles file I/O, window management, and the native menu. The **preload script** is a secure bridge — the renderer has zero Node.js access. The React app is split into: common UI primitives, layout components, the PDF reading pipeline, and the dark-mode engine. State is managed with React Context and a small reducer."

### The Dual-Target Design (~30 seconds)
> "The same codebase powers the browser app and the desktop app. We detect Electron with a simple flag from the preload bridge. In the browser, file opening falls back to a hidden HTML input. In Electron, it uses native file dialogs and can read/write files directly. The reading engine is 100% shared."

### Closing (~30 seconds)
> "NocturaPDF is deliberately small and focused. Every feature answers one question: **does this help someone read?** The codebase follows the same principle — minimal dependencies, clean separation, performance as a core constraint. It's a project that prioritizes doing one thing really well over doing many things adequately."

---

## Quick Reference: All Files at a Glance

| File | Purpose | Key Concept |
|------|---------|-------------|
| `package.json` | Manifest + scripts + builder config | ESM, 3 runtime deps |
| `vite.config.js` | Vite config | `base: "./"` for file:// loading |
| `index.html` | HTML entry | Root div, favicon |
| `eslint.config.js` | Linting rules | Two configs: browser vs node |
| `electron/main.cjs` | Main process | IPC, window, security |
| `electron/preload.cjs` | Secure bridge | contextBridge, isElectron |
| `electron/menu.cjs` | Native menu | File/Edit/View/Help with accelerators |
| `electron/package.json` | Forces CommonJS | Overrides root ESM |
| `src/main.jsx` | React entry | StrictMode mount |
| `src/App.jsx` | Root component | Routing, state, orchestration (835 lines) |
| `src/index.css` | Global styles | CSS vars, print rules, fonts |
| `components/common/Button.jsx` | Text button | Variants: default/ghost |
| `components/common/IconButton.jsx` | Icon button | aria-label required, 32px target |
| `components/common/icons.jsx` | SVG icon set | Hand-rolled, 20+ icons |
| `components/common/Modal.jsx` | Dialog wrapper | Backdrop, Escape close |
| `components/common/PageShell.jsx` | Page layout | Header + content + footer |
| `components/common/Popover.jsx` | Menu container | Outside-click close |
| `components/dialogs/AboutDialog.jsx` | App info dialog | Fetches Electron version info |
| `components/dialogs/KeyboardShortcutsDialog.jsx` | Shortcuts reference | Platform-aware keys |
| `components/dialogs/PropertiesDialog.jsx` | File properties | File stats + PDF metadata |
| `components/layout/AppMenu.jsx` | Dropdown menu | Submenu support, items w/ shortcuts |
| `components/layout/SecondaryToolbar.jsx` | Utility bar | Page nav, zoom, fit, color modes |
| `components/layout/Sidebar.jsx` | Page thumbnails + outline | Virtualized thumbnails |
| `components/layout/SiteFooter.jsx` | Site footer | Copyright + Get App |
| `components/layout/SiteHeader.jsx` | Site header | Logo + nav + CTA |
| `components/layout/TabBar.jsx` | Document tabs | Shrink-to-fit flex |
| `components/layout/TopAppBar.jsx` | Main app bar | Menus + tabs + theme toggle |
| `components/reader/EmptyState.jsx` | Start screen | Recent files + Open button |
| `components/reader/PageCanvas.jsx` | Single page renderer | Raw cache + theme reapply |
| `components/reader/PdfViewer.jsx` | PDF loader | Document lifecycle, pdf.js |
| `components/reader/RecentFileCard.jsx` | Recent file display | Thumbnail + remove on hover |
| `components/reader/RecentFilesGrid.jsx` | Recent grid container | Reusable grid wrapper |
| `components/reader/ScrollContainer.jsx` | Scroll viewport | Virtualization, ctrl+scroll zoom |
| `features/darkmode/darkmodeEngine.js` | Pixel color engine | LUT + HSL reconstruction |
| `hooks/useKeyboard.js` | Keyboard shortcuts | Global keydown listener |
| `hooks/usePdfColorMode.js` | Content theme context | LUT computation, persistence |
| `hooks/useRoute.js` | Client router | History API + popstate |
| `hooks/useUiTheme.js` | Chrome theme context | System/media-query aware |
| `pages/AboutPage.jsx` | About content | Product philosophy |
| `pages/DevelopersPage.jsx` | Developer info | Stack + architecture docs |
| `pages/DownloadPage.jsx` | Download page | GitHub releases CTA |
| `pages/LandingPage.jsx` | Marketing home | Hero + features grid |
| `pages/landing.css` | Landing styles | Hover states + media queries |
| `services/recentFilesService.js` | Recent files CRUD | localStorage-backed |
| `services/settingService.js` | Settings access | Theme, color mode, sidebar |
| `services/storageService.js` | localStorage wrapper | JSON + key prefix |
| `store/appstore.js` | Tab state | Context + useReducer |
| `utils/constants.js` | App constants | Themes, color modes, zoom limits |
| `utils/formatters.js` | Helpers | hexToRgb |
| `utils/themeCssVars.js` | CSS vars generator | Theme → CSS custom properties |

---

*This document was generated as a technical presentation guide. For the full code, see https://github.com/LamrotG/NocturaPDF*
</content>
<task_progress>
- [x] Explore project structure and configuration files
- [x] Read all source code files
- [x] Understand architecture and tech stack
- [x] Create comprehensive technical documentation
- [ ] Verify documentation completeness
</task_progress>