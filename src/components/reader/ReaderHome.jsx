import React, { useCallback, useEffect, useState } from "react";
import { PlusIcon, CloudOffIcon, ListIcon, GridIcon, TrashIcon } from "../common/icons.jsx";
import {
  getRecentDocuments,
  getLocalLibraryDocuments,
  getCloudLibraryDocuments,
  removeFromLocalLibrary,
} from "../../persistence/index.js";
import { isOpfsSupported, readLocalPdf } from "../../services/opfsService.js";
import { getRecentView, setRecentView } from "../../services/settingService.js";
import { clearRecentFiles } from "../../services/recentFilesService.js";
import HomeSidebar from "../layout/HomeSidebar.jsx";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

function OpenPdfCard({ onOpenFile }) {
  return (
    <button
      onClick={onOpenFile}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 20,
        borderRadius: 12,
        border: "1px dashed var(--border)",
        background: "var(--code-bg)",
        color: "var(--text-h)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        minHeight: 180,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.background = "var(--accent-bg)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "var(--code-bg)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "var(--accent-bg)",
          color: "var(--accent)",
        }}
      >
        <PlusIcon size={24} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, textAlign: "center" }}>
        Open a PDF to start reading
      </span>
    </button>
  );
}

function CardDoc({ doc, onOpen, onRemoveFromLibrary, showRemove }) {
  return (
    <div
      onClick={() => onOpen(doc)}
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--code-bg)",
        padding: 14,
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--accent-bg)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          📄
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-h)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={doc.filename}
          >
            {doc.filename}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {formatDate(doc.lastOpened)}
            {doc.lastPage ? ` · p.${doc.lastPage}` : ""}
            {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ""}
          </div>
        </div>
      </div>
      {showRemove && (
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromLibrary?.(doc);
            }}
            style={{
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Remove from Library
          </button>
        </div>
      )}
    </div>
  );
}

function ListRow({ doc, onOpen, onRemoveFromLibrary, showRemove }) {
  return (
    <div
      onClick={() => onOpen(doc)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--code-bg)",
        cursor: "pointer",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--accent-bg)",
          color: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        📄
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-h)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {doc.filename}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {formatDate(doc.lastOpened)}
          {doc.lastPage ? ` · p.${doc.lastPage}` : ""}
          {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ""}
        </div>
      </div>
      {showRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromLibrary?.(doc);
          }}
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 6,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}

/**
 * Reader Home — the primary PWA dashboard.
 * Left sidebar (Recents/Local/Cloud/Settings/Profile) + main content area.
 */
export default function ReaderHome({
  onOpenFile,
  onOpenDocument,
  activeView = "recent",
  onSelectView,
  onOpenSettings,
  onOpenProfile,
  onSignIn,
  isSignedIn,
  profile,
}) {
  const [recent, setRecent] = useState([]);
  const [localLibrary, setLocalLibrary] = useState([]);
  const [opfsAvailable, setOpfsAvailable] = useState(false);
  const [viewMode, setViewMode] = useState(() => getRecentView());
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [rec, local] = await Promise.all([
        getRecentDocuments(),
        getRecentDocuments(),
        getLocalLibraryDocuments(),
        getCloudLibraryDocuments(),
      ]);
      setRecent(rec);
      setLocalLibrary(local);
      setCloudLibrary(cloud);
    } catch {
      // IndexedDB unavailable — show empty sections.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setOpfsAvailable(isOpfsSupported());
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleOpenDocument = useCallback(
    async (doc) => {
      if (doc.libraryType === "local" && doc.localKey) {
        try {
          const file = await readLocalPdf(doc.localKey, doc.filename);
          onOpenDocument(file, doc);
          return;
        } catch {
          // Fall through to file picker.
        }
      }
      onOpenFile();
    },
    [onOpenDocument, onOpenFile]
  );

  const handleRemoveFromLibrary = useCallback(
    async (doc) => {
      await removeFromLocalLibrary(doc.id);
      refresh();
    },
    [refresh]
  );

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setRecentView(mode);
  }, []);

  const handleClearRecent = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);
    // Clear recent from localStorage (recentFilesService).
    clearRecentFiles();
    setRecent([]);
  }, [confirmClear]);

  const renderDocs = (docs, showLibraryAction = false) => {
    if (viewMode === "list") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((doc) => (
            <ListRow
              key={doc.id}
              doc={doc}
              onOpen={handleOpenDocument}
              onRemoveFromLibrary={showLibraryAction ? handleRemoveFromLibrary : null}
              showRemove={showLibraryAction}
            />
          ))}
        </div>
      );
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {docs.map((doc) => (
          <CardDoc
            key={doc.id}
            doc={doc}
            onOpen={handleOpenDocument}
            onRemoveFromLibrary={showLibraryAction ? handleRemoveFromLibrary : null}
            showRemove={showLibraryAction}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", minHeight: 0 }}>
      <HomeSidebar
        activeView={activeView}
        onSelectView={onSelectView}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
        onSignIn={onSignIn}
        isSignedIn={isSignedIn}
        profile={profile}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          padding: "24px 24px 40px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* ── View header ─────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-h)",
                margin: 0,
              }}
            >
              {activeView === "recent" ? "Recents" : activeView === "local" ? "Local Library" : "Cloud Library"}
            </h2>

            {/* View toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => handleViewModeChange("list")}
                aria-label="List view"
                title="List view"
                style={{
                  border: "none",
                  background: viewMode === "list" ? "var(--accent-bg)" : "transparent",
                  color: viewMode === "list" ? "var(--accent)" : "var(--text)",
                  borderRadius: 6,
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => handleViewModeChange("grid")}
                aria-label="Grid view"
                title="Grid view"
                style={{
                  border: "none",
                  background: viewMode === "grid" ? "var(--accent-bg)" : "transparent",
                  color: viewMode === "grid" ? "var(--accent)" : "var(--text)",
                  borderRadius: 6,
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <GridIcon size={18} />
              </button>
            </div>
          </div>

          {/* ── Recent view ──────────────────────────────────────── */}
          {activeView === "recent" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                <OpenPdfCard onOpenFile={onOpenFile} />
                {viewMode === "grid" &&
                  recent.map((doc) => (
                    <CardDoc key={doc.id} doc={doc} onOpen={handleOpenDocument} />
                  ))}
              </div>
              {viewMode === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {recent.map((doc) => (
                    <ListRow key={doc.id} doc={doc} onOpen={handleOpenDocument} />
                  ))}
                </div>
              )}
              {recent.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16 }}>
                  No recently opened documents yet.
                </p>
              )}

              {/* Clear recent */}
              {recent.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                  <button
                    onClick={handleClearRecent}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: confirmClear ? "#d33" : "var(--text)",
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    <TrashIcon size={14} />
                    {confirmClear ? "Click again to confirm" : "Clear recent"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Local Library view ──────────────────────────────── */}
          {activeView === "local" && (
            <>
              {!opfsAvailable ? (
                <EmptySection message="Local Library requires OPFS, which is not supported in this browser." />
              ) : localLibrary.length === 0 ? (
                <EmptySection message="No documents in your Local Library yet. Add PDFs to keep them available offline." />
              ) : (
                renderDocs(localLibrary, true)
              )}
            </>
          )}

          {/* ── Cloud Library view ───────────────────────────────── */}
          {activeView === "cloud" && (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: 12,
                padding: "32px 24px",
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>☁️</div>
              <p style={{ margin: "0 0 8px", fontWeight: 500, color: "var(--text-h)" }}>
                Cloud sync is not connected
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                Your documents stay local and private. Cloud functionality will be
                available in a future update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptySection({ message }) {
  return (
    <div
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 12,
        padding: "24px 16px",
        textAlign: "center",
        color: "var(--text-secondary)",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}