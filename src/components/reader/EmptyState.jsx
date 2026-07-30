import React from "react";
import { PlusIcon } from "../common/icons.jsx";
import RecentFileCard from "./RecentFileCard.jsx";

// The official NocturaPDF start screen — shown whenever no document is open.
// Displays recently opened files (if 5+) and always shows the open PDF button.
export default function EmptyState({ onOpenFile, recentFiles, onRemoveRecentFile }) {
  // Only show recent files if there are at least 5
  const showRecentFiles = recentFiles && recentFiles.length >= 5;

  // If no recent files, center the button
  if (!showRecentFiles) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          onClick={onOpenFile}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "48px 56px",
            borderRadius: 16,
            border: "1px dashed var(--border)",
            background: "var(--code-bg)",
            color: "var(--text-h)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.background = "var(--accent-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--code-bg)";
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--accent-bg)",
              color: "var(--accent)",
              transition: "all 0.2s ease",
            }}
          >
            <PlusIcon size={32} />
          </span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Open a PDF to start reading</span>
        </button>
      </div>
    );
  }

  // If recent files, show button and files in grid
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "auto",
        paddingTop: 32,
        paddingBottom: 32,
      }}
    >
      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-h)",
          marginBottom: 16,
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: 900,
          paddingLeft: 20,
          paddingRight: 20,
          alignSelf: "flex-start",
        }}
      >
        Recently Opened
      </h2>

      {/* Grid with button first, then recent files */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: 900,
          paddingLeft: 20,
          paddingRight: 20,
          width: "100%",
        }}
      >
        {/* Open PDF Button as first grid item */}
        <button
          onClick={onOpenFile}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 16,
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
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
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
              transition: "all 0.2s ease",
            }}
          >
            <PlusIcon size={24} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, textAlign: "center" }}>
            Open a PDF to start reading
          </span>
        </button>

        {/* Recent file cards */}
        {recentFiles.map((file) => (
          <RecentFileCard
            key={file.id}
            recentFile={file}
            onOpenFile={onOpenFile}
            onRemoveFile={onRemoveRecentFile}
          />
        ))}
      </div>
    </div>
  );
}
