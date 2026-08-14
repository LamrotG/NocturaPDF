import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UiThemeProvider, useUiTheme } from "./hooks/useUiTheme.js";
import { PdfColorModeProvider, usePdfColorMode } from "./hooks/usePdfColorMode.js";
import { AppStoreProvider, useAppStore } from "./store/appstore.js";
import { AuthProvider, useAuth } from "./hooks/useAuth.js";
import { useKeyboard } from "./hooks/useKeyboard.js";
import { useRoute, isStandalonePwa } from "./hooks/useRoute.js";
import { themeToCssVars } from "./utils/themeCssVars.js";
import { MAX_SCALE, MIN_SCALE, ZOOM_STEP } from "./utils/constants.js";
import { recordDocumentOpen, createDebouncedPositionSaver } from "./persistence/index.js";
import TopAppBar from "./components/layout/TopAppBar.jsx";
import SecondaryToolbar from "./components/layout/SecondaryToolbar.jsx";
import PdfViewer from "./components/reader/PdfViewer.jsx";
import ReaderHome from "./components/reader/ReaderHome.jsx";
import PdfSearch from "./components/reader/PdfSearch.jsx";
import TextSelectionActions from "./components/reader/TextSelectionActions.jsx";
import PdfToolsPanel from "./components/reader/PdfToolsPanel.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProfileSettingsPage from "./pages/ProfileSettingsPage.jsx";
import PropertiesDialog from "./components/dialogs/PropertiesDialog.jsx";
import KeyboardShortcutsDialog from "./components/dialogs/KeyboardShortcutsDialog.jsx";
import AboutDialog from "./components/dialogs/AboutDialog.jsx";
import AboutThemesDialog from "./components/dialogs/AboutThemesDialog.jsx";

// Website pages — imported from the web/ directory for the auth flow.
// The reader redirects to the website for sign-in/account creation.
import LandingPage from "../web/pages/LandingPage.jsx";
import AboutPage from "../web/pages/AboutPage.jsx";
import DevelopersPage from "../web/pages/DevelopersPage.jsx";
import DocumentationPage from "../web/pages/DocumentationPage.jsx";
import SignInPage from "../web/pages/SignInPage.jsx";
import SignUpPage from "../web/pages/SignUpPage.jsx";
import ResetPasswordPage from "../web/pages/ResetPasswordPage.jsx";

const APP_WEBSITE = "https://github.com/LamrotG/NocturaPDF";
const USER_MANUAL_URL = "https://github.com/LamrotG/NocturaPDF#readme";

// ── Save / Save As helpers ─────────────────────────────────────────────
// In a PWA, "Save" writes back to the original file when possible (OPFS
// local library), otherwise it falls back to a download. "Save As" always
// asks the user where to save via the browser's download dialog.
async function savePdfToFile(file, suggestedName) {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName || file.name || "document.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

function Shell({ showHomeView = false, showSettingsView = false, showProfileView = false, onGoHome, onNavigateReader, onNavigate }) {
  const { resolvedTheme } = useUiTheme();
  const { colorModeId, setColorModeId, colorMode, lut, colorModes } = usePdfColorMode();
  const { tabs, activeTabId, activeTab, openTab, closeTab, setActiveTab, updateTab } = useAppStore();
  const { isSignedIn, profile } = useAuth();

  const rootRef = useRef(null);
  const fileInputRef = useRef(null);
  const viewerContainerRef = useRef(null);

  const [zoomFactor, setZoomFactor] = useState(1);
  const [fitMode, setFitMode] = useState("width");
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scrollRequest, setScrollRequest] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [documentId, setDocumentId] = useState(null);
  const [initialScrollPosition, setInitialScrollPosition] = useState(null);
  const [activeView, setActiveView] = useState("recent");

  const [focusMode, setFocusMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTool, setActiveTool] = useState("select");

  // Dialog state
  const [showProperties, setShowProperties] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAboutThemes, setShowAboutThemes] = useState(false);

  const hasDoc = Boolean(activeTab);

  // Debounced reading-position saver — never writes on every scroll event.
  const positionSaverRef = useRef(null);
  if (positionSaverRef.current == null) {
    positionSaverRef.current = createDebouncedPositionSaver({ delayMs: 800 });
  }

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
    setDocumentId(null);
    setInitialScrollPosition(null);
    setSearchOpen(false);
  }

  // Mirrors the real browser fullscreen state — Esc can exit native
  // fullscreen outside our own toggle handler, so this can't be a plain
  // toggle boolean, it has to stay synced to `document.fullscreenElement`.
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Flush reading position on page hide / unload.
  useEffect(() => {
    const flush = () => {
      positionSaverRef.current?.flushNow();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  const handleOpenFile = useCallback(
    async (file, existingDoc) => {
      // Open the tab immediately so the UI responds fast.
      openTab(file, file.name, existingDoc?.id || null, existingDoc?.readingPosition || null);
      if (showHomeView) {
        onNavigateReader?.();
      }
    },
    [openTab, showHomeView, onNavigateReader]
  );

  const handleNavigateToReader = useCallback(() => {
    onNavigateReader?.();
  }, [onNavigateReader]);

  const handleSelectTab = useCallback(
    (id) => {
      // Flush the current tab's reading position before switching.
      positionSaverRef.current?.flushNow();
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

  // `activeTab` changes whenever the store is updated (updateTab swaps the tab
  // object). If we used it directly as a callback dep, handleDocumentLoad would
  // change identity after the document loads, which would re-run PdfViewer's
  // load effect → creating a NEW document and destroying the live worker while
  // PageCanvas/PdfSearch are mid getTextContent ("Worker task was terminated").
  // Keep it in a ref so the callback stays stable.
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Track recently opened file when PDF is loaded
  const handleDocumentLoad = useCallback(
    async (pdfDocument) => {
      setPdfDoc(pdfDocument);

      const tab = activeTabRef.current;
      if (tab && pdfDocument) {
        try {
          // Resolve persistent document identity + record the open.
          const record = await recordDocumentOpen(tab.file, pdfDocument);
          setDocumentId(record.id);
          updateTab(tab.id, { documentId: record.id });

          // Restore reading position if we have one.
          const pos = record.readingPosition;
          if (pos) {
            setInitialScrollPosition(pos);
            if (pos.zoom) {
              setZoomFactor(pos.zoom);
              setFitMode("custom");
            }
            if (pos.rotation) {
              setRotation(pos.rotation);
            }
            if (pos.page) {
              setCurrentPage(pos.page);
              setScrollRequest({ page: pos.page, id: Date.now() });
            }
          }
        } catch (e) {
          console.warn("Error recording document:", e);
        }
      }
    },
    // Stable identity: only updateTab is a real dep; activeTab is read via a ref.
    [updateTab]
  );

  const handleScrollPositionChange = useCallback(
    (y) => {
      if (documentId) {
        positionSaverRef.current?.schedule(documentId, {
          page: currentPage,
          x: 0,
          y,
          zoom: zoomFactor,
          rotation,
        });
      }
    },
    [documentId, currentPage, zoomFactor, rotation]
  );

  const handleJumpToPage = useCallback((page) => {
    setCurrentPage(page);
    setScrollRequest({ page, id: Date.now() });
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

  // ── File operations ──────────────────────────────────────────────────
  // Save: writes back to the original file when possible (OPFS local
  // library), otherwise falls back to a download of the same name.
  const handleSave = useCallback(async () => {
    if (!activeTab?.file) return;
    try {
      // If the file came from the Local Library (OPFS), write it back.
      const { saveLocalPdf } = await import("./services/opfsService.js");
      const { getDocument } = await import("./persistence/index.js");
      const doc = activeTab.documentId ? await getDocument(activeTab.documentId) : null;
      if (doc?.localKey) {
        // Save back to OPFS
        await saveLocalPdf(activeTab.file);
        return;
      }
      // Otherwise, download a copy with the same name.
      await savePdfToFile(activeTab.file, activeTab.file.name);
    } catch (e) {
      console.error("Save failed:", e);
      // Fallback: download a copy.
      try {
        await savePdfToFile(activeTab.file, activeTab.file.name);
      } catch (e2) {
        console.error("Save fallback failed:", e2);
      }
    }
  }, [activeTab]);

  // Save As: always asks the user where to save via the browser's download
  // dialog, allowing them to choose the filename/location.
  const handleSaveAs = useCallback(async () => {
    if (!activeTab?.file) return;
    try {
      await savePdfToFile(activeTab.file, activeTab.file.name);
    } catch (e) {
      console.error("Save As failed:", e);
    }
  }, [activeTab]);

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

  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleSearchFromSelection = useCallback((text) => {
    setSearchQuery(text);
    setSearchOpen(true);
  }, []);

  const [pendingCloseTabId, setPendingCloseTabId] = useState(null);

  const handleCloseTab = useCallback(
    (id) => {
      // Flush reading position before closing.
      positionSaverRef.current?.flushNow();
      closeTab(id);
    },
    [closeTab]
  );

  const handleRequestCloseTab = useCallback(
    (id) => {
      // Check if the tab has unsaved changes (annotations/bookmarks).
      const tab = tabs.find((t) => t.id === id);
      if (!tab) return;
      // If the document has been modified (has annotations), ask to save.
      // For simplicity, we always ask when a document is open.
      setPendingCloseTabId(id);
    },
    [tabs]
  );

  const handleConfirmCloseTab = useCallback(() => {
    if (pendingCloseTabId) {
      handleCloseTab(pendingCloseTabId);
    }
    setPendingCloseTabId(null);
  }, [pendingCloseTabId, handleCloseTab]);

  const handleSaveAndCloseTab = useCallback(async () => {
    if (pendingCloseTabId) {
      // Save the file locally (download a copy) then close.
      const tab = tabs.find((t) => t.id === pendingCloseTabId);
      if (tab?.file) {
        try {
          await savePdfToFile(tab.file, tab.file.name);
        } catch (e) {
          console.error("Save failed:", e);
        }
      }
      handleCloseTab(pendingCloseTabId);
    }
    setPendingCloseTabId(null);
  }, [pendingCloseTabId, tabs, handleCloseTab]);

  useKeyboard({
    onPrevPage: () => handleJumpToPage(Math.max(1, currentPage - 1)),
    onNextPage: () => handleJumpToPage(Math.min(Math.max(numPages, 1), currentPage + 1)),
    onFirstPage: () => handleJumpToPage(1),
    onLastPage: () => handleJumpToPage(Math.max(numPages, 1)),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: handleZoomReset,
    onToggleFocusMode: handleToggleFocusMode,
    onOpenSearch: handleOpenSearch,
    onFindNext: () => {},
    onFindPrevious: () => {},
    onOpenFile: handleOpenFileDialog,
    onCloseTab: () => activeTabId && handleRequestCloseTab(activeTabId),
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onPrint: handlePrint,
    onProperties: () => setShowProperties(true),
    onRotateCW: handleRotateCW,
    onRotateCCW: handleRotateCCW,
    onToggleFullscreen: handleToggleFullscreen,
    onTogglePresentation: handleTogglePresentationMode,
    onEscape: () => {
      setFocusMode(false);
      setPresentationMode(false);
      setSearchOpen(false);
    },
  });

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
            onCloseTab={handleRequestCloseTab}
            onAddTab={handleOpenFileDialog}
            onGoHome={onGoHome}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            hasDoc={hasDoc}
            recentFiles={[]}
            onOpenRecent={() => {}}
            onClearRecent={() => {}}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onPrint={handlePrint}
            onProperties={() => setShowProperties(true)}
            onFind={handleOpenSearch}
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
            onTogglePresentation={handleTogglePresentationMode}
            onVisitWebsite={handleVisitWebsite}
            onUserManual={handleUserManual}
            onKeyboardShortcuts={() => setShowShortcuts(true)}
            onAbout={() => setShowAbout(true)}
            onAboutThemes={() => setShowAboutThemes(true)}
          />

          <SecondaryToolbar
            currentPage={currentPage}
            numPages={numPages}
            onJumpToPage={handleJumpToPage}
            zoomFactor={zoomFactor}
            onZoomChange={setZoomFactor}
            fitMode={fitMode}
            onFitModeChange={handleFitModeChange}
            onOpenSearch={handleOpenSearch}
            colorModes={colorModes}
            colorModeId={colorModeId}
            onColorModeChange={setColorModeId}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </>
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        <div
          ref={viewerContainerRef}
          style={{ flex: 1, minWidth: 0, position: "relative" }}
        >
          {searchOpen && !showHomeView && pdfDoc && (
            <PdfSearch
              pdfDoc={pdfDoc}
              onJumpToPage={handleJumpToPage}
              onClose={() => setSearchOpen(false)}
              initialQuery={searchQuery}
            />
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
              onScrollPositionChange={handleScrollPositionChange}
              scrollRequest={scrollRequest}
              rotation={rotation}
              initialScrollPosition={initialScrollPosition}
            />
          ) : null}

          {showSettingsView ? (
            <SettingsPage onNavigate={onNavigate} />
          ) : showProfileView ? (
            <ProfileSettingsPage onNavigate={onNavigate} />
          ) : showHomeView || !activeTab ? (
            <ReaderHome
              onOpenFile={handleOpenFileDialog}
              onOpenDocument={handleOpenFile}
              activeView={activeView}
              onSelectView={setActiveView}
              onOpenSettings={() => onNavigate("/settings")}
              onOpenProfile={() => onNavigate("/profile")}
              onSignIn={() => onNavigate("/signin")}
              isSignedIn={isSignedIn}
              profile={profile}
            />
          ) : null}

          {!showHomeView && activeTab && (
            <PdfToolsPanel
              containerRef={viewerContainerRef}
              documentId={documentId}
              currentPage={currentPage}
              onToolChange={setActiveTool}
              activeTool={activeTool}
            />
          )}

          {!showHomeView && activeTab && (
            <TextSelectionActions
              containerRef={viewerContainerRef}
              documentId={documentId}
              currentPage={currentPage}
              onSearch={handleSearchFromSelection}
            />
          )}
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
      <AboutThemesDialog open={showAboutThemes} onClose={() => setShowAboutThemes(false)} />

      {/* Unsaved changes dialog */}
      {pendingCloseTabId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "var(--text-h)" }}>
              Save changes?
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
              This document has unsaved changes (highlights, bookmarks, or notes).
              Do you want to save it before closing?
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPendingCloseTabId(null)}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-h)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCloseTab}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                Don't Save
              </button>
              <button
                onClick={handleSaveAndCloseTab}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "1px solid var(--accent)",
                  background: "var(--accent)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppRoot() {
  const [path, navigate] = useRoute();
  const { resolvedTheme } = useUiTheme();
  const cssVars = useMemo(() => themeToCssVars(resolvedTheme), [resolvedTheme]);

  // Installed PWA opens directly into the reader — never the marketing site.
  const standalone = isStandalonePwa();
  const effectivePath = standalone && path === "/" ? "/app" : path;

  // ── Reader routes ────────────────────────────────────────────────────
  if (effectivePath.startsWith("/app")) {
    return (
      <PdfColorModeProvider>
        <AppStoreProvider>
          <Shell
            showHomeView={false}
            onGoHome={() => navigate("/app")}
            onNavigateReader={() => navigate("/app")}
            onNavigate={navigate}
          />
        </AppStoreProvider>
      </PdfColorModeProvider>
    );
  }

  if (effectivePath.startsWith("/settings")) {
    return (
      <PdfColorModeProvider>
        <AppStoreProvider>
          <Shell
            showSettingsView={true}
            showHomeView={true}
            onGoHome={() => navigate("/app")}
            onNavigateReader={() => navigate("/app")}
            onNavigate={navigate}
          />
        </AppStoreProvider>
      </PdfColorModeProvider>
    );
  }

  if (effectivePath.startsWith("/profile")) {
    return (
      <PdfColorModeProvider>
        <AppStoreProvider>
          <Shell
            showHomeView={true}
            showProfileView={true}
            onGoHome={() => navigate("/app")}
            onNavigateReader={() => navigate("/app")}
            onNavigate={navigate}
          />
        </AppStoreProvider>
      </PdfColorModeProvider>
    );
  }

  // ── Website routes (auth flow) ───────────────────────────────────────
  // The reader redirects to the website for sign-in/account creation.
  // After successful auth, the user is redirected back to the reader.
  if (effectivePath.startsWith("/signin")) {
    return (
      <div style={cssVars}>
        <SignInPage onNavigate={navigate} />
      </div>
    );
  }

  if (effectivePath.startsWith("/signup")) {
    return (
      <div style={cssVars}>
        <SignUpPage onNavigate={navigate} />
      </div>
    );
  }

  if (effectivePath.startsWith("/reset-password")) {
    return (
      <div style={cssVars}>
        <ResetPasswordPage onNavigate={navigate} />
      </div>
    );
  }

  // ── Website content pages ────────────────────────────────────────────
  if (effectivePath.startsWith("/about")) {
    return (
      <div style={cssVars}>
        <AboutPage onNavigate={navigate} />
      </div>
    );
  }

  if (effectivePath.startsWith("/docs")) {
    return (
      <div style={cssVars}>
        <DocumentationPage onNavigate={navigate} />
      </div>
    );
  }

  if (effectivePath.startsWith("/developers")) {
    return (
      <div style={cssVars}>
        <DevelopersPage onNavigate={navigate} />
      </div>
    );
  }

  // ── Landing page (website home) ──────────────────────────────────────
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