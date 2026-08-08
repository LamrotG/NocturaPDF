import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UiThemeProvider, useUiTheme } from "./hooks/useUiTheme.js";
import { PdfColorModeProvider, usePdfColorMode } from "./hooks/usePdfColorMode.js";
import { AppStoreProvider, useAppStore } from "./store/appstore.js";
import { AuthProvider, useAuth } from "./hooks/useAuth.js";
import { useKeyboard } from "./hooks/useKeyboard.js";
import { useRoute } from "./hooks/useRoute.js";
import { getSidebarCollapsed, setSidebarCollapsed as persistSidebarCollapsed } from "./services/settingService.js";
import { addRecentFile, getRecentFiles, removeRecentFile, clearRecentFiles } from "./services/recentFilesService.js";
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
import DocumentationPage from "./pages/DocumentationPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ProfileSettingsPage from "./pages/ProfileSettingsPage.jsx";
import PropertiesDialog from "./components/dialogs/PropertiesDialog.jsx";
import KeyboardShortcutsDialog from "./components/dialogs/KeyboardShortcutsDialog.jsx";
import AboutDialog from "./components/dialogs/AboutDialog.jsx";

const APP_WEBSITE = "https://github.com/LamrotG/NocturaPDF";
const USER_MANUAL_URL = "https://github.com/LamrotG/NocturaPDF#readme";

function Shell({ showHomeView = false, onGoHome, onNavigateReader, onNavigate }) {
  const { uiThemeId, resolvedTheme, setUiThemeId } = useUiTheme();
  const { colorModeId, setColorModeId, colorMode, lut, colorModes } = usePdfColorMode();
  const { tabs, activeTabId, activeTab, openTab, closeTab, setActiveTab } = useAppStore();
  const { isSignedIn, profile } = useAuth();

  const rootRef = useRef(null);
  const fileInputRef = useRef(null);

  const [zoomFactor, setZoomFactor] = useState(1);
  const [fitMode, setFitMode] = useState("width");
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scrollRequest, setScrollRequest] = useState(null);
  const [rotation, setRotation] = useState(0);

  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => getSidebarCollapsed());
  const [focusMode, setFocusMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentFiles, setRecentFiles] = useState(() => getRecentFiles());

  // Dialog state
  const [showProperties, setShowProperties] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const hasDoc = Boolean(activeTab);

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
    setRotation(0);
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

  const handleNavigateToReader = useCallback(() => {
    onNavigateReader?.();
  }, [onNavigateReader]);

  const handleSelectTab = useCallback(
    (id) => {
      setActiveTab(id);
      if (showHomeView) {
        handleNavigateToReader();
      }
    },
    [setActiveTab, showHomeView, handleNavigateToReader]
  );

  // Open file dialog — PWA uses the HTML file input (no Electron native dialog).
  const handleOpenFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Open all selected files in their respective tabs
      Array.from(files).forEach((file) => {
        handleOpenFile(file);
      });
      if (showHomeView) {
        handleNavigateToReader();
      }
    }
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
          const updated = addRecentFile(activeTab.file, thumbnail);
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
    () => {
      // In the PWA, recent files are just metadata — the actual bytes are
      // either in OPFS (Local Library) or re-picked by the user. For now,
      // open the file picker so the user can re-select the file.
      handleOpenFileDialog();
    },
    [handleOpenFileDialog]
  );

  // Handle removing a file from recent files list
  const handleRemoveRecentFile = useCallback((fileId) => {
    const updated = removeRecentFile(fileId);
    setRecentFiles(updated);
  }, []);

  // Handle clearing all recent files
  const handleClearRecentFiles = useCallback(() => {
    clearRecentFiles();
    setRecentFiles([]);
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

  const handleTogglePresentationMode = useCallback(() => {
    setPresentationMode((v) => {
      const next = !v;
      // Presentation mode hides all chrome and enters fullscreen
      if (next) {
        rootRef.current?.requestFullscreen?.().catch(() => {});
      } else {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      }
      return next;
    });
  }, []);

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

  // ── Zoom handlers ────────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => {
    setFitMode("custom");
    setZoomFactor((z) => Math.min(MAX_SCALE, +(z + ZOOM_STEP).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setFitMode("custom");
    setZoomFactor((z) => Math.max(MIN_SCALE, +(z - ZOOM_STEP).toFixed(2)));
  }, []);

  const handleZoomReset = useCallback(() => {
    setFitMode("width");
    setZoomFactor(1);
  }, []);

  const handleFitWidth = useCallback(() => {
    setFitMode("width");
    setZoomFactor(1);
  }, []);

  const handleFitPage = useCallback(() => {
    setFitMode("page");
    setZoomFactor(1);
  }, []);

  const handleActualSize = useCallback(() => {
    setFitMode("custom");
    setZoomFactor(1);
  }, []);

  // ── Rotation handlers ────────────────────────────────────────────────
  const handleRotateCW = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleRotateCCW = useCallback(() => {
    setRotation((r) => (r + 270) % 360);
  }, []);

  // ── File operations (PWA: no native save dialog) ─────────────────────
  const handleSaveAs = useCallback(async () => {
    if (!activeTab?.file) return;
    try {
      const arrayBuffer = await activeTab.file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeTab.file.name || "document.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Save As failed:", e);
    }
  }, [activeTab]);

  const handleSave = useCallback(() => {
    // In the PWA, "Save" is the same as "Save As" (download a copy).
    handleSaveAs();
  }, [handleSaveAs]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Help actions ─────────────────────────────────────────────────────
  const handleVisitWebsite = useCallback(() => {
    window.open(APP_WEBSITE, "_blank");
  }, []);

  const handleUserManual = useCallback(() => {
    window.open(USER_MANUAL_URL, "_blank");
  }, []);

  useKeyboard({
    onPrevPage: () => handleJumpToPage(Math.max(1, currentPage - 1)),
    onNextPage: () => handleJumpToPage(Math.min(Math.max(numPages, 1), currentPage + 1)),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: handleZoomReset,
    onToggleFocusMode: handleToggleFocusMode,
    onOpenSearch: () => setSearchOpen(true),
    onFindNext: () => {},
    onFindPrevious: () => {},
    onOpenFile: handleOpenFileDialog,
    onCloseTab: () => activeTabId && closeTab(activeTabId),
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onPrint: handlePrint,
    onProperties: () => setShowProperties(true),
    onRotateCW: handleRotateCW,
    onRotateCCW: handleRotateCCW,
    onToggleSidebar: handleToggleSidebar,
    onToggleFullscreen: handleToggleFullscreen,
    onTogglePresentation: handleTogglePresentationMode,
    onEscape: () => {
      setFocusMode(false);
      setPresentationMode(false);
      setSearchOpen(false);
    },
  });

  // Focus mode temporarily overrides the sidebar without mutating the
  // persisted preference — exiting focus mode restores whatever was saved.
  const effectiveSidebarCollapsed = sidebarCollapsed || focusMode || presentationMode;

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
        multiple
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {!focusMode && !presentationMode && (
        <>
          <TopAppBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={closeTab}
            onAddTab={handleOpenFileDialog}
            uiThemeId={uiThemeId}
            setUiThemeId={setUiThemeId}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            hasDoc={hasDoc}
            recentFiles={recentFiles}
            onOpenRecent={handleOpenRecentFile}
            onClearRecent={handleClearRecentFiles}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onPrint={handlePrint}
            onProperties={() => setShowProperties(true)}
            onFind={() => setSearchOpen(true)}
            onFindNext={() => {}}
            onFindPrevious={() => {}}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onFitWidth={handleFitWidth}
            onFitPage={handleFitPage}
            onActualSize={handleActualSize}
            onRotateCW={handleRotateCW}
            onRotateCCW={handleRotateCCW}
            onToggleSidebar={handleToggleSidebar}
            onTogglePresentation={handleTogglePresentationMode}
            onVisitWebsite={handleVisitWebsite}
            onUserManual={handleUserManual}
            onKeyboardShortcuts={() => setShowShortcuts(true)}
            onAbout={() => setShowAbout(true)}
            onGoHome={onGoHome}
            isSignedIn={isSignedIn}
            profileName={profile?.name}
            onProfile={() => onNavigate("/profile")}
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

          {!showHomeView && activeTab ? (
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
              rotation={rotation}
            />
          ) : null}

          {showHomeView ? (
            <EmptyState
              onOpenFile={handleOpenFileDialog}
              recentFiles={recentFiles}
              onRemoveRecentFile={handleRemoveRecentFile}
            />
          ) : null}

          {!showHomeView && !activeTab ? (
            <EmptyState
              onOpenFile={handleOpenFileDialog}
              recentFiles={recentFiles}
              onRemoveRecentFile={handleRemoveRecentFile}
            />
          ) : null}
        </div>
      </div>

      {/* Dialogs */}
      <PropertiesDialog
        open={showProperties}
        onClose={() => setShowProperties(false)}
        file={activeTab?.file}
        pdfDoc={pdfDoc}
        numPages={numPages}
      />
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <AboutDialog
        open={showAbout}
        onClose={() => setShowAbout(false)}
      />
    </div>
  );
}

function AppRoot() {
  const [path, navigate] = useRoute();
  const { resolvedTheme } = useUiTheme();
  const cssVars = useMemo(() => themeToCssVars(resolvedTheme), [resolvedTheme]);

  // The reader is the app itself — the logo in the corner serves as "home".
  if (path.startsWith("/app")) {
    return (
      <PdfColorModeProvider>
        <AppStoreProvider>
          <Shell
            showHomeView={false}
            onGoHome={() => navigate("/")}
            onNavigateReader={() => navigate("/app")}
            onNavigate={navigate}
          />
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

  if (path.startsWith("/docs")) {
    return (
      <div style={cssVars}>
        <DocumentationPage onNavigate={navigate} />
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

  if (path.startsWith("/signin")) {
    return (
      <div style={cssVars}>
        <SignInPage onNavigate={navigate} />
      </div>
    );
  }

  if (path.startsWith("/signup")) {
    return (
      <div style={cssVars}>
        <SignUpPage onNavigate={navigate} />
      </div>
    );
  }

  if (path.startsWith("/reset-password")) {
    return (
      <div style={cssVars}>
        <ResetPasswordPage onNavigate={navigate} />
      </div>
    );
  }

  if (path.startsWith("/profile")) {
    return (
      <div style={cssVars}>
        <ProfileSettingsPage onNavigate={navigate} />
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
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </UiThemeProvider>
  );
}