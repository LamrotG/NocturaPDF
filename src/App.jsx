import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UiThemeProvider, useUiTheme } from "./hooks/useUiTheme.js";
import { PdfColorModeProvider, usePdfColorMode } from "./hooks/usePdfColorMode.js";
import { AppStoreProvider, useAppStore } from "./store/appstore.js";
import { useKeyboard } from "./hooks/useKeyboard.js";
import { useRoute } from "./hooks/useRoute.js";
import { getSidebarCollapsed, setSidebarCollapsed as persistSidebarCollapsed } from "./services/settingService.js";
import { addRecentFile, getRecentFiles, removeRecentFile } from "./services/recentFilesService.js";
import { themeToCssVars } from "./utils/themeCssVars.js";
import { MAX_SCALE, MIN_SCALE, ZOOM_STEP } from "./utils/constants.js";
import TopAppBar from "./components/layout/TopAppBar.jsx";
import SecondaryToolbar from "./components/layout/SecondaryToolbar.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import PdfViewer from "./components/reader/PdfViewer.jsx";
import EmptyState from "./components/reader/EmptyState.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import DevelopersPage from "./pages/DevelopersPage.jsx";
import DownloadPage from "./pages/DownloadPage.jsx";

function Shell() {
  const { uiThemeId, resolvedTheme, setUiThemeId } = useUiTheme();
  const { colorModeId, setColorModeId, colorMode, lut, colorModes } = usePdfColorMode();
  const { tabs, activeTabId, activeTab, openTab, closeTab, setActiveTab } = useAppStore();

  const rootRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfDocRef = useRef(null);

  const [zoomFactor, setZoomFactor] = useState(1);
  const [fitMode, setFitMode] = useState("width");
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scrollRequest, setScrollRequest] = useState(null);

  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => getSidebarCollapsed());
  const [focusMode, setFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentFiles, setRecentFiles] = useState(() => getRecentFiles());

  // Each tab reloads its own pdf.js document independently (inactive tabs are
  // fully unmounted, see PdfViewer's `key`), so reset derived reader state
  // whenever the active tab changes. Done during render (React's documented
  // "adjusting state when a prop changes" pattern) rather than in an effect,
  // since it's a pure reset with no external system to synchronize with.
  const [resetForTabId, setResetForTabId] = useState(activeTabId);
  if (resetForTabId !== activeTabId) {
    setResetForTabId(activeTabId);
    setZoomFactor(1);
    setFitMode("width");
    setCurrentPage(1);
    setNumPages(0);
    setPdfDoc(null);
    setScrollRequest(null);
  }

  // Mirrors the real browser fullscreen state — Esc can exit native
  // fullscreen outside our own toggle handler, so this can't be a plain
  // toggle boolean, it has to stay synced to `document.fullscreenElement`.
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleOpenFile = useCallback((file) => openTab(file, file.name), [openTab]);

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleOpenFile(file);
    e.target.value = "";
  };

  // Generate a thumbnail from the first page of a PDF
  const generateThumbnail = useCallback(async (pdfDocument) => {
    if (!pdfDocument || pdfDocument.numPages < 1) {
      return "";
    }

    try {
      const page = await pdfDocument.getPage(1);
      const scale = 0.2; // Small thumbnail
      const viewport = page.getViewport({ scale });

      // Create canvas for rendering
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render page to canvas
      const context = canvas.getContext("2d");
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
      });

      await renderTask.promise;

      // Convert to base64 data URL
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch (e) {
      console.warn("Failed to generate PDF thumbnail:", e);
      return "";
    }
  }, []);

  // Track recently opened file when PDF is loaded
  const handleDocumentLoad = useCallback(
    async (pdfDocument) => {
      setPdfDoc(pdfDocument);
      
      // Generate and save thumbnail if we have an active tab
      if (activeTab && pdfDocument) {
        try {
          const thumbnail = await generateThumbnail(pdfDocument);
          // Extract file path if available (File API doesn't expose path, but we can try)
          let filePath = null;
          if (activeTab.file && activeTab.file.path) {
            filePath = activeTab.file.path;
          } else if (activeTab.file && activeTab.file.webkitRelativePath) {
            // Try webkitRelativePath as fallback
            filePath = activeTab.file.webkitRelativePath;
          }
          const updated = addRecentFile(activeTab.file, thumbnail, filePath);
          setRecentFiles(updated);
        } catch (e) {
          console.warn("Error tracking recent file:", e);
        }
      }
    },
    [activeTab, generateThumbnail]
  );

  // Handle opening a file from recent files
  const handleOpenRecentFile = useCallback(
    async (recentFile) => {
      // If in Electron and we have a file path, try to open it directly
      if (typeof window !== "undefined" && window.nocturaPdf?.isElectron && recentFile.filePath) {
        try {
          // Read file from disk
          const result = await window.nocturaPdf.readFile(recentFile.filePath);
          if (result.success) {
            // Convert array back to Uint8Array
            const uint8Array = new Uint8Array(result.data);
            // Create a pseudo-File object for the viewer
            const fileObj = new File([uint8Array], recentFile.name, { type: "application/pdf" });
            // Store the path for future reference
            fileObj.path = recentFile.filePath;
            openTab(fileObj, recentFile.name);
            return;
          }
        } catch (error) {
          console.warn("Failed to open file from recent files:", error);
          // Fall back to opening in file explorer
          try {
            await window.nocturaPdf.openFileExplorer(recentFile.filePath);
            return;
          } catch (e) {
            console.warn("Failed to open file explorer:", e);
          }
        }
      }
      
      // Fallback: open file picker
      fileInputRef.current?.click();
    },
    [openTab]
  );

  // Handle removing a file from recent files list
  const handleRemoveRecentFile = useCallback((fileId) => {
    const updated = removeRecentFile(fileId);
    setRecentFiles(updated);
  }, []);

  const handleJumpToPage = useCallback((page) => {
    setCurrentPage(page);
    setScrollRequest({ page, id: Date.now() });
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      persistSidebarCollapsed(next);
      return next;
    });
  }, []);

  const handleToggleFocusMode = useCallback(() => setFocusMode((v) => !v), []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await rootRef.current?.requestFullscreen();
      }
    } catch {
      /* ignore: fullscreen request rejected (no user gesture, unsupported, etc.) */
    }
  }, []);

  const handleFitModeChange = useCallback((mode) => setFitMode(mode), []);

  useKeyboard({
    onPrevPage: () => handleJumpToPage(Math.max(1, currentPage - 1)),
    onNextPage: () => handleJumpToPage(Math.min(Math.max(numPages, 1), currentPage + 1)),
    onZoomIn: () => {
      setFitMode("custom");
      setZoomFactor((z) => Math.min(MAX_SCALE, +(z + ZOOM_STEP).toFixed(2)));
    },
    onZoomOut: () => {
      setFitMode("custom");
      setZoomFactor((z) => Math.max(MIN_SCALE, +(z - ZOOM_STEP).toFixed(2)));
    },
    onToggleFocusMode: handleToggleFocusMode,
    onOpenSearch: () => setSearchOpen(true),
    onEscape: () => {
      setFocusMode(false);
      setSearchOpen(false);
    },
  });

  // Focus mode temporarily overrides the sidebar without mutating the
  // persisted preference — exiting focus mode restores whatever was saved.
  const effectiveSidebarCollapsed = sidebarCollapsed || focusMode;

  const cssVars = useMemo(() => themeToCssVars(resolvedTheme), [resolvedTheme]);

  return (
    <div
      ref={rootRef}
      style={{
        ...cssVars,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {!focusMode && (
        <>
          <TopAppBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
            onAddTab={() => fileInputRef.current?.click()}
            uiThemeId={uiThemeId}
            setUiThemeId={setUiThemeId}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          <SecondaryToolbar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
            currentPage={currentPage}
            numPages={numPages}
            onJumpToPage={handleJumpToPage}
            zoomFactor={zoomFactor}
            onZoomChange={setZoomFactor}
            fitMode={fitMode}
            onFitModeChange={handleFitModeChange}
            onOpenSearch={() => setSearchOpen(true)}
            colorModes={colorModes}
            colorModeId={colorModeId}
            onColorModeChange={setColorModeId}
          />
        </>
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        <Sidebar
          pdfDoc={pdfDoc}
          numPages={numPages}
          currentPage={currentPage}
          onJumpToPage={handleJumpToPage}
          colorMode={colorMode}
          lut={lut}
          collapsed={effectiveSidebarCollapsed}
        />

        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          {searchOpen && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
            >
              <input
                autoFocus
                placeholder="Search (coming soon)"
                disabled
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--text-h)",
                  fontSize: 13,
                  width: 180,
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                style={{ border: "none", background: "none", color: "var(--text)", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          )}

          {activeTab ? (
            <PdfViewer
              key={activeTab.id}
              file={activeTab.file}
              colorMode={colorMode}
              lut={lut}
              zoomFactor={zoomFactor}
              fitMode={fitMode}
              onZoomChange={setZoomFactor}
              onCurrentPageChange={setCurrentPage}
              onNumPagesChange={setNumPages}
              onDocumentLoad={handleDocumentLoad}
              scrollRequest={scrollRequest}
            />
          ) : (
            <EmptyState 
              onOpenFile={() => fileInputRef.current?.click()}
              recentFiles={recentFiles}
              onRemoveRecentFile={handleRemoveRecentFile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// The desktop build loads dist/index.html straight off disk (or the Vite dev
// server root), neither of which is the "/app" path our history-based router
// checks below. Flagging Electron here lets the reader open immediately
// instead of showing the marketing landing page first.
const isElectron = typeof window !== "undefined" && Boolean(window.nocturaPdf?.isElectron);

function AppRoot() {
  const [path, navigate] = useRoute();
  const { resolvedTheme } = useUiTheme();
  const cssVars = useMemo(() => themeToCssVars(resolvedTheme), [resolvedTheme]);

  if (isElectron || path.startsWith("/app")) {
    return (
      <PdfColorModeProvider>
        <AppStoreProvider>
          <Shell />
        </AppStoreProvider>
      </PdfColorModeProvider>
    );
  }

  if (path.startsWith("/about")) {
    return (
      <div style={cssVars}>
        <AboutPage onNavigate={navigate} />
      </div>
    );
  }

  if (path.startsWith("/developers")) {
    return (
      <div style={cssVars}>
        <DevelopersPage onNavigate={navigate} />
      </div>
    );
  }

  if (path.startsWith("/download")) {
    return (
      <div style={cssVars}>
        <DownloadPage onNavigate={navigate} />
      </div>
    );
  }

  return (
    <div style={cssVars}>
      <LandingPage onStartReading={() => navigate("/app")} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <UiThemeProvider>
      <AppRoot />
    </UiThemeProvider>
  );
}
