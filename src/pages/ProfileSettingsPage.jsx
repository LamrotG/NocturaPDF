import React, { useRef, useState } from "react";
import SiteHeader from "../components/layout/SiteHeader.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { updateProfile, updatePassword, deleteAccount } from "../services/authService.js";

const PRESET_COLORS = ["#4caf50", "#ff9800", "#ffc107", "#9c27b0", "#2196f3"];
const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1 MB
const AVATAR_SIZE = 200; // 200 × 200 px

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--code-bg)",
  color: "var(--text-h)",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-h)",
  marginBottom: 6,
};

const errorStyle = { fontSize: 13, color: "#d33", margin: "8px 0 0" };
const successStyle = { fontSize: 13, color: "#2e7d32", margin: "8px 0 0" };
const sectionTitleStyle = { fontSize: 18, fontWeight: 600, color: "var(--text-h)", margin: "32px 0 16px" };

function AvatarCircle({ color, selected, onClick, size = 48, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        border: selected ? "3px solid var(--accent)" : "3px solid transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        overflow: "hidden",
        flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Crop an uploaded image to exactly 200×200 px (square).
 * Returns a data URL.
 */
function cropToSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image file."));
    };
    img.src = url;
  });
}

export default function ProfileSettingsPage({ onNavigate }) {
  const { user, profile, signOut } = useAuth();
  const fileInputRef = useRef(null);

  // Edit profile state
  const [name, setName] = useState(profile?.name || "");
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color || PRESET_COLORS[0]);
  const [customAvatar, setCustomAvatar] = useState(profile?.avatar_url || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setProfileError("");
    setProfileMsg("");

    // Validate file size (max 1 MB).
    if (file.size > MAX_AVATAR_SIZE) {
      setProfileError("Image is too large. Maximum size is 1 MB.");
      return;
    }

    // Validate file type.
    if (!file.type.startsWith("image/")) {
      setProfileError("Invalid file type. Please upload an image.");
      return;
    }

    try {
      const dataUrl = await cropToSquare(file);
      setCustomAvatar(dataUrl);
      setAvatarColor(null); // custom avatar overrides color
    } catch (err) {
      setProfileError(err.message || "Failed to process image.");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    setSavingProfile(true);
    const { error } = await updateProfile({
      name,
      avatarUrl: customAvatar || null,
      avatarColor: avatarColor || null,
    });
    setSavingProfile(false);
    if (error) {
      setProfileError(error);
      return;
    }
    setProfileMsg("Profile updated successfully.");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdError("");

    if (newPassword !== confirmNewPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    setSavingPwd(true);
    const { error } = await updatePassword(newPassword, oldPassword);
    setSavingPwd(false);
    if (error) {
      setPwdError(error);
      return;
    }
    setPwdMsg("Password updated successfully.");
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (deleteConfirm.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      setDeleteError(error);
      return;
    }
    onNavigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader onNavigate={onNavigate} />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "56px 24px 88px" }}>
        <h1 style={{ fontSize: 28, color: "var(--text-h)", margin: "0 0 8px" }}>Profile Settings</h1>
        <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 8px" }}>
          Signed in as <strong>{user?.email}</strong>
        </p>

        {/* ── Edit Profile ─────────────────────────────────────────── */}
        <h2 style={sectionTitleStyle}>Edit Profile</h2>
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Your name"
            />
          </div>

          {/* ── Avatar selector ─────────────────────────────────── */}
          <div>
            <label style={labelStyle}>Avatar</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {PRESET_COLORS.map((color) => (
                <AvatarCircle
                  key={color}
                  color={color}
                  selected={!customAvatar && avatarColor === color}
                  onClick={() => {
                    setAvatarColor(color);
                    setCustomAvatar("");
                  }}
                >
                  {(profile?.name || "U").charAt(0).toUpperCase()}
                </AvatarCircle>
              ))}

              {/* Custom avatar upload */}
              <AvatarCircle
                color="#607d8b"
                selected={Boolean(customAvatar)}
                onClick={() => fileInputRef.current?.click()}
              >
                {customAvatar ? (
                  <img
                    src={customAvatar}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 24 }}>+</span>
                )}
              </AvatarCircle>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
            />
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 0" }}>
              Max 1 MB. Images are cropped to 200 × 200 px.
            </p>
          </div>

          {profileError && <p style={errorStyle}>{profileError}</p>}
          {profileMsg && <p style={successStyle}>{profileMsg}</p>}

          <button
            type="submit"
            disabled={savingProfile}
            style={{
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: savingProfile ? "default" : "pointer",
              opacity: savingProfile ? 0.6 : 1,
            }}
          >
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>

        {/* ── Change Password ──────────────────────────────────────── */}
        <h2 style={sectionTitleStyle}>Change Password</h2>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="old-password">Current Password</label>
            <input
              id="old-password"
              type="password"
              required
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="confirm-new-password">Confirm New Password</label>
            <input
              id="confirm-new-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={inputStyle}
              placeholder="Re-enter new password"
            />
          </div>

          {pwdError && <p style={errorStyle}>{pwdError}</p>}
          {pwdMsg && <p style={successStyle}>{pwdMsg}</p>}

          <button
            type="submit"
            disabled={savingPwd}
            style={{
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: savingPwd ? "default" : "pointer",
              opacity: savingPwd ? 0.6 : 1,
            }}
          >
            {savingPwd ? "Updating…" : "Change Password"}
          </button>
        </form>

        {/* ── Log Out ──────────────────────────────────────────────── */}
        <h2 style={sectionTitleStyle}>Session</h2>
        <button
          onClick={async () => { await signOut(); onNavigate("/"); }}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-h)",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>

        {/* ── Delete Account ───────────────────────────────────────── */}
        <h2 style={{ ...sectionTitleStyle, color: "#d33" }}>Danger Zone</h2>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: "1px solid #d33",
            background: "rgba(221, 51, 51, 0.05)",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 12px", lineHeight: 1.6 }}>
            Deleting your account will permanently remove your profile, cloud
            library, and all synced reading metadata. This action cannot be undone.
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            style={inputStyle}
            placeholder='Type "delete" to confirm'
          />
          {deleteError && <p style={errorStyle}>{deleteError}</p>}
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid #d33",
              background: "#d33",
              color: "#fff",
              cursor: deleting ? "default" : "pointer",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? "Deleting…" : "Delete Account"}
          </button>
        </div>
      </div>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}