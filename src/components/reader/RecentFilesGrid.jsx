import React from "react";
import RecentFileCard from "./RecentFileCard.jsx";

/**
 * Container component for displaying recent files as a grid
 */
export default function RecentFilesGrid({ recentFiles, onOpenFile, onRemoveFile }) {
  if (!recentFiles || recentFiles.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        width: "100%",
        paddingBottom: 24,
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
        }}
      >
        Recently Opened
      </h2>
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
        }}
      >
        {recentFiles.map((file) => (
          <RecentFileCard
            key={file.id}
            recentFile={file}
            onOpenFile={onOpenFile}
            onRemoveFile={onRemoveFile}
          />
        ))}
      </div>
    </div>
  );
}
