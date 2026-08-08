import React, { useState } from "react";
import SiteHeader from "../components/layout/SiteHeader.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { updateProfile, updatePassword, deleteAccount } from "../services/authService.js";

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

// UI color conventions: green = success, red = danger/error, amber = warning
const errorStyle = { fontSize: 13, color: "#d33", margin: "8px 0 0" };
const successStyle = { fontSize: 13, color: "#2e7d32", margin: "8px 0 0" };

const sectionTitleStyle = { fontSize: 18, fontWeight: 600, color: "var(--text-h)", margin: "32px 0 16px" };

export default function ProfileSettingsPage({ onNavigate }) {
  const { user, profile, signOut } = useAuth();

  // Edit profile state
  const [name, setName] = useState(profile?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    setSavingProfile(true);
    const { error } = await updateProfile({ name, avatarUrl: avatarUrl || null });
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
      setDeleteError("Please type \"delete\" to confirm.");
      return;
    }
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      setDeleteError(error);
      return;
    }
    // Auth state change will sign out automatically.
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

          <div>
            <label style={labelStyle} htmlFor="avatar-url">Avatar URL (optional)</label>
            <input
              id="avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              style={inputStyle}
              placeholder="https://example.com/avatar.png"
            />
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