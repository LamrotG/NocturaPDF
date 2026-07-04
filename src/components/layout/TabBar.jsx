import React from "react";
import IconButton from "../common/IconButton.jsx";
import { PlusIcon } from "../common/icons.jsx";

// Tabs always fit within the available strip width — as more open, they
// keep shrinking down to TAB_MIN_WIDTH (enough for a close button and a
// sliver of the truncated title) rather than triggering a horizontal
// scrollbar.
const TAB_MIN_WIDTH = 44;
const TAB_MAX_WIDTH = 200;

// Tabs represent documents, never tools — this bar only ever holds one
// entry per open PDF plus a trailing "+" to open another. Always renders
// (even with zero tabs) so there's a way to open a first file from the tab
// strip itself, not only via the File menu.
export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onAddTab }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px 6px 12px",
              borderRadius: 6,
              background: isActive ? "var(--code-bg)" : "transparent",
              color: isActive ? "var(--text-h)" : "var(--text)",
              cursor: "pointer",
              fontSize: 13,
              // Tabs shrink together as more open, down to TAB_MIN_WIDTH.
              flex: `1 1 ${TAB_MAX_WIDTH}px`,
              minWidth: TAB_MIN_WIDTH,
              maxWidth: TAB_MAX_WIDTH,
              flexShrink: 1,
            }}
            title={tab.name}
          >
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tab.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              aria-label={`Close ${tab.name}`}
              style={{
                flexShrink: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "inherit",
                opacity: 0.6,
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <IconButton aria-label="Open PDF" size={28} onClick={onAddTab} style={{ flexShrink: 0 }}>
        <PlusIcon size={16} />
      </IconButton>
    </div>
  );
}
