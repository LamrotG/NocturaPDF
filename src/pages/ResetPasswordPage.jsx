import React, { useState } from "react";
import SiteHeader from "../components/layout/SiteHeader.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import { updatePassword } from "../services/authService.js";

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

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#d33" };
  if (score <= 3) return { score: 2, label: "Fair", color: "#f59e0b" };
  if (score <= 4) return { score: 3, label: "Good", color: "#2e7d32" };
  return { score: 4, label: "Strong", color: "#2e7d32" };
}

export default function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setSuccess("Password updated successfully. You can now sign in with your new password.");
    setTimeout(() => onNavigate("/signin"), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader onNavigate={onNavigate} />

      <div style={{ maxWidth: 400, margin: "0 auto", padding: "72px 24px 88px" }}>
        <h1 style={{ fontSize: 28, color: "var(--text-h)", margin: "0 0 8px" }}>Reset Password</h1>
        <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 32px" }}>
          Enter a new password for your account.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="At least 8 characters"
            />
            {password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: i <= strength.score ? strength.color : "var(--border)",
                        transition: "background 200ms",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle} htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: confirmPassword && !passwordsMatch ? "#d33" : "var(--border)",
              }}
              placeholder="Re-enter your new password"
            />
            {confirmPassword && !passwordsMatch && (
              <p style={errorStyle}>Passwords do not match.</p>
            )}
          </div>

          {error && <p style={errorStyle}>{error}</p>}
          {success && <p style={successStyle}>{success}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}