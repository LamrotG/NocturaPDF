import React, { useCallback, useEffect, useState } from "react";
import { FileText, Cloud } from "lucide-react";
import { PlusIcon, CloudOffIcon, ListIcon, GridIcon, TrashIcon } from "../icons.jsx";
import {
  getRecentDocuments,
  getLocalLibraryDocuments,
  removeFromLocalLibrary,
} from "../../persistence/index.js";
import { isOpfsSupported, readLocalPdf } from "../../services/opfsService.js";
import { getRecentView, setRecentView } from "../../services/settingService.js";
import { clearRecentFiles } from "../../services/recentFilesService.js";
import { listCloudPdfs, downloadCloudPdf, uploadPdf } from "../../services/cloudStorageService.js";
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
            flexShrink: 0,
          }}
        >
          <FileText size={18} />
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
          flexShrink: 0,
        }}
      >
        <FileText size={16} />
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
  const [cloudLibrary, setCloudLibrary] = useState([]);
  const [cloudFileInputRef] = React.useRef(null);
  const [opfsAvailable, setOpfsAvailable] = useState(false);
  const [viewMode, setViewMode] = useState(() => getRecentView());
  const [confirmClear, setConfirmClear] = useState(false);
  const [uploadingCloud, setUploadingCloud] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [rec, local] = await Promise.all([
        getRecentDocuments(),
        getLocalLibraryDocuments(),
      ]);
      setRecent(rec);
      setLocalLibrary(local);
    } catch {
      // IndexedDB unavailable — show empty sections.
    }
    // Cloud files come live from Supabase when signed in.
    if (isSignedIn) {
      try {
        const cloud = await listCloudPdfs();
        setCloudLibrary(cloud && !cloud.error ? cloud : []);
      } catch {
        setCloudLibrary([]);
      }
    } else {
      setCloudLibrary([]);
    }
  }, [isSignedIn]);

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
      // Cloud documents carry a Supabase row id — download + open directly.
      if (doc.libraryType === "cloud" || (doc.storage_path && !doc.localKey)) {
        try {
          const file = await downloadCloudPdf(doc.id || doc.pdf_id);
          if (file && !file.error) {
            onOpenDocument(file, { ...doc, libraryType: "cloud" });
            return;
          }
        } catch {
          // Fall through to file picker.
        }
        onOpenFile();
        return;
      }
      onOpenFile();
    },
    [onOpenDocument, onOpenFile]
  );

  const handleUploadCloud = async (e) => {
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length) return;
    setUploadingCloud(true);
    try {
      for (const file of Array.from(files)) {
        await uploadPdf(file);
      }
      await refresh();
    } finally {
      setUploadingCloud(false);
    }
  };

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
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <button
                      onClick={onOpenFile}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: "1px solid var(--accent)",
                        background: "var(--accent)",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <PlusIcon size={16} />
                      Open File
                    </button>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 0" }}>
                      Documents you open here are saved to your device for offline access.
                    </p>
                  </div>
                  {localLibrary.length === 0 ? (
                    <EmptySection message="No documents in your Local Library yet. Open a PDF to save it here for offline reading." />
                  ) : (
                    renderDocs(localLibrary, true)
                  )}
                </>
              )}
            </>
          )}

          {/* ── Cloud Library view ───────────────────────────────── */}
          {activeView === "cloud" && (
            <div>
              {!isSignedIn ? (
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
                  <div style={{ marginBottom: 12, color: "var(--text-secondary)" }}>
                    <Cloud size={40} />
                  </div>
                  <p style={{ margin: "0 0 8px", fontWeight: 500, color: "var(--text-h)" }}>
                    Cloud Library
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 13 }}>
                    Sign in to sync and access your documents anywhere.
                  </p>
                  <button
                    onClick={onSignIn}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 10,
                      border: "1px solid var(--accent)",
                      background: "var(--accent)",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <button
                      onClick={() => cloudFileInputRef.current?.click()}
                      disabled={uploadingCloud}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 10,
                        border: "1px solid var(--accent)",
                        background: "var(--accent)",
                        color: "#fff",
                        cursor: uploadingCloud ? "default" : "pointer",
                        opacity: uploadingCloud ? 0.6 : 1,
                      }}
                    >
                      <PlusIcon size={16} />
                      {uploadingCloud ? "Uploading…" : "Upload PDF"}
                    </button>
                    <input
                      ref={cloudFileInputRef}
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={handleUploadCloud}
                      style={{ display: "none" }}
                    />
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 0" }}>
                      Your files are saved to your NocturaPDF cloud account.
                    </p>
                  </div>

                  {cloudLibrary.length === 0 ? (
                    <EmptySection message="No files on cloud." />
                  ) : (
                    renderDocs(cloudLibrary, false)
                  )}
                </>
              )}
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