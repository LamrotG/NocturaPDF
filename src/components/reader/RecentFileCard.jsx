import React, { useState } from "react";
import { FileText } from "lucide-react";
import { XIcon } from "../common/icons.jsx";

/**
 * Card component for displaying a recent file
 * Shows thumbnail, filename, and allows opening or removing the file
 */
export default function RecentFileCard({ recentFile, onOpenFile, onRemoveFile }) {
  const { id, name, thumbnail, openedAt } = recentFile;

  // Compute "time ago" label. Date.now() is impure, so we use a lazy
  // useState initializer (runs once on mount) to capture the timestamp,
  // then derive the label from it.
  const [timeAgoLabel] = useState(() => {
    const now = Date.now();
    const diff = now - openedAt;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      if (days === 1) return "Yesterday";
      return `${days} days ago`;
    }
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  });

  const [showRemoveButton, setShowRemoveButton] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--code-bg)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        setShowRemoveButton(true);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
        setShowRemoveButton(false);
      }}
    >
      {/* Thumbnail */}
      <div
        onClick={() => onOpenFile(recentFile)}
        style={{
          flex: 1,
          background: thumbnail ? `url(${thumbnail})` : "var(--bg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {!thumbnail && (
          <div
            style={{
              color: "var(--text-secondary)",
              opacity: 0.5,
            }}
          >
            <FileText size={48} />
          </div>
        )}
      </div>

      {/* File info */}
      <div
        onClick={() => onOpenFile(recentFile)}
        style={{
          padding: "12px 12px",
          borderTop: "1px solid var(--border)",
          flex: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-h)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 4,
          }}
          title={name}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          {timeAgoLabel}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveFile(id);
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "none",
          background: "rgba(0, 0, 0, 0.6)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: showRemoveButton ? 1 : 0,
          transition: "opacity 0.2s ease",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 59, 48, 0.8)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
        }}
        title="Remove from recent files"
      >
        <XIcon size={18} />
      </button>
    </div>
  );
}