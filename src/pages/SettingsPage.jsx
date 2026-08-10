import React from "react";
import { useUiTheme } from "../hooks/useUiTheme.js";
import { SunIcon, MoonIcon, MonitorIcon } from "../components/common/icons.jsx";

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: SunIcon },
  { id: "dark", label: "Dark", icon: MoonIcon },
  { id: "system", label: "System", icon: MonitorIcon },
];

/**
 * Application Settings page.
 * Controls the app-wide UI theme (Light/Dark/System).
 * This is separate from the PDF reading theme in the reader toolbar.
 */
export default function SettingsPage({ onNavigate }) {
  const { uiThemeId, setUiThemeId } = useUiTheme();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "24px 24px 40px",
        boxSizing: "border-box",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-h)", margin: "0 0 24px" }}>
          Settings
        </h1>

        {/* ── Application Theme ─────────────────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-h)", margin: "0 0 12px" }}>
            Application Theme
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
            Controls the overall UI appearance. This is separate from the PDF
            reading theme in the reader toolbar.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = uiThemeId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setUiThemeId(opt.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "16px 20px",
                    borderRadius: 10,
                    border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: isActive ? "var(--accent-bg)" : "var(--code-bg)",
                    color: isActive ? "var(--accent)" : "var(--text-h)",
                    cursor: "pointer",
                    minWidth: 100,
                  }}
                >
                  <Icon size={22} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Back to Home ──────────────────────────────────────── */}
        <button
          onClick={() => onNavigate("/app")}
          style={{
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-h)",
            cursor: "pointer",
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}