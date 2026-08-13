import React, { useState } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { signInWithEmail, signInWithProvider, sendPasswordResetEmail } from "../../reader/services/authService.js";

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

export default function SignInPage({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Check if we were redirected from the reader.
  const cameFromReader = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("from") === "reader" || params.get("redirect") === "reader";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const { error: err, errorType: type } = await signInWithEmail(email, password);
    setLoading(false);

    if (err) {
      setError(err);

      // If email not registered, redirect to signup with pre-filled values.
      if (type === "email_not_registered") {
        setTimeout(() => {
          onNavigate(`/signup?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&from=reader`);
        }, 1500);
      }
      return;
    }
    // On success, redirect back to the reader (from=reader) or the app.
    onNavigate(cameFromReader() ? "/app" : "/app");
  };

  const handleGoogle = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    const { error: err } = await signInWithProvider("google");
    setLoading(false);
    if (err) setError(err);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const { error: err } = await sendPasswordResetEmail(forgotEmail || email);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess("Password reset email sent. Check your inbox.");
  };

  // Forgot password view
  if (showForgot) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <SiteHeader onNavigate={onNavigate} />
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "72px 24px 88px" }}>
          <h1 style={{ fontSize: 28, color: "var(--text-h)", margin: "0 0 8px" }}>Forgot Password</h1>
          <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 32px" }}>
            Enter your email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle} htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={forgotEmail || email}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
              />
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
              {loading ? "Sending…" : "Send Reset Email"}
            </button>
          </form>

          <p style={{ fontSize: 14, color: "var(--text)", margin: "24px 0 0", textAlign: "center" }}>
            <button
              onClick={() => { setShowForgot(false); }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 14,
                color: "var(--accent)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Back to Sign In
            </button>
          </p>
        </div>
        <SiteFooter onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader onNavigate={onNavigate} />

      <div style={{ maxWidth: 400, margin: "0 auto", padding: "72px 24px 88px" }}>
        <h1 style={{ fontSize: 28, color: "var(--text-h)", margin: "0 0 8px" }}>Sign In</h1>
        <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 32px" }}>
          Sign in to sync your library and reading progress across devices.
        </p>

        {cameFromReader() && (
          <div
            style={{
              background: "var(--accent-bg)",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 24,
              fontSize: 13,
              color: "var(--accent)",
              lineHeight: 1.5,
            }}
          >
            You came from the reader. After signing in, you'll be returned to NocturaPDF automatically.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
            />
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            onClick={() => setShowForgot(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 13,
              color: "var(--text)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Forgot Password?
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 13, color: "var(--text)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-h)",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Continue with Google
        </button>

        <p style={{ fontSize: 12.5, color: "var(--text)", margin: "12px 0 0", lineHeight: 1.5 }}>
          When you sign in with Google, we only use your email address and name
          to create your account. We never post to your Google account or access
          your other Google data.
        </p>

        <p style={{ fontSize: 14, color: "var(--text)", margin: "32px 0 0", textAlign: "center" }}>
          New here?{" "}
          <button
            onClick={() => onNavigate(cameFromReader() ? "/signup?from=reader" : "/signup")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 14,
              color: "var(--accent)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Create account
          </button>
        </p>

        {cameFromReader() && (
          <p style={{ fontSize: 14, color: "var(--text)", margin: "16px 0 0", textAlign: "center" }}>
            <button
              onClick={() => onNavigate("/app")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 14,
                color: "var(--text-h)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← Return to NocturaPDF
            </button>
          </p>
        )}
      </div>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}