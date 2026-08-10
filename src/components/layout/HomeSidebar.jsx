import React from "react";
import { SettingsIcon, ListIcon, GridIcon } from "../common/icons.jsx";

const NAV_ITEMS = [
  { id: "recent", label: "Recents"},
  { id: "local", label: "Local Library"},
  { id: "cloud", label: "Cloud Library"},
];

const PRESET_AVATAR_COLORS = ["#4caf50", "#ff9800", "#ffc107", "#9c27b0", "#2196f3"];

function Avatar({ profile, size = 32 }) {
  const color = profile?.avatar_color || PRESET_AVATAR_COLORS[0];
  const initial = (profile?.name || "U").charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.45,
        fontWeight: 600,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initial
      )}
    </div>
  );
}

/**
 * Left sidebar for the Home/dashboard view.
 * Navigation: Recents, Local Library, Cloud Library.
 * Bottom: Settings + Profile.
 */
export default function HomeSidebar({
  activeView,
  onSelectView,
  onOpenSettings,
  onOpenProfile,
  onSignIn,
  isSignedIn,
  profile,
}) {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      {/* Main navigation */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 10px",
                marginBottom: 2,
                borderRadius: 8,
                border: "none",
                background: isActive ? "var(--accent-bg)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-h)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Settings + Profile */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "8px" }}>
        <button
          onClick={onOpenSettings}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--text-h)",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <SettingsIcon size={18} />
          Settings
        </button>

        <button
          onClick={isSignedIn ? onOpenProfile : onSignIn}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--text-h)",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Avatar profile={profile} size={28} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isSignedIn ? profile?.name || "Profile" : "Sign In"}
          </span>
        </button>
      </div>
    </div>
  );
}