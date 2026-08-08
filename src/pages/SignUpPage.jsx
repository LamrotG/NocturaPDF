import React, { useState } from "react";
import SiteHeader from "../components/layout/SiteHeader.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import { signUpWithEmail, signInWithProvider, resendVerificationEmail } from "../services/authService.js";

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

// Password strength scoring
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

// Read pre-filled values from URL query params (e.g. /signup?email=...&password=...)
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    email: params.get("email") || "",
    password: params.get("password") || "",
  };
}

export default function SignUpPage({ onNavigate }) {
  const prefill = getQueryParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefill.email);
  const [password, setPassword] = useState(prefill.password);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: err, needsVerification: verify } = await signUpWithEmail({ email, password, name });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (verify) {
      setNeedsVerification(true);
    } else {
      onNavigate("/app");
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await signInWithProvider("google");
    setLoading(false);
    if (err) setError(err);
  };

  const handleResend = async () => {
    setResendSent(false);
    const { error: err } = await resendVerificationEmail(email);
    if (err) {
      setError(err);
      return;
    }
    setResendSent(true);
  };

  // After signup, show the verification screen.
  if (needsVerification) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <SiteHeader onNavigate={onNavigate} />
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "72px 24px 88px", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, color: "var(--text-h)", margin: "0 0 16px" }}>Check your email</h1>
          <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6, margin: "0 0 24px" }}>
            We sent a verification email to <strong>{email}</strong>. Open it and
            click the <strong>Verify Email</strong> button to confirm your account.
            Once verified, you can sign in normally.
          </p>
          <p style={{ fontSize: 13, color: "var(--text)", margin: "0 0 24px" }}>
            Didn't get it?{" "}
            <button
              onClick={handleResend}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 13,
                color: "var(--accent)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Resend verification email
            </button>
          </p>
          {resendSent && (
            <p style={successStyle}>Verification email sent. Check your inbox.</p>
          )}
          <button
            onClick={() => onNavigate("/signin")}
            style={{
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Go to Sign In
          </button>
        </div>
        <SiteFooter onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader onNavigate={onNavigate} />

      <div style={{ maxWidth: 400, margin: "0 auto", padding: "72px 24px 88px" }}>
        <h1 style={{ fontSize: 28, color: "var(--text-h)", margin: "0 0 8px" }}>Create account</h1>
        <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 32px" }}>
          Create an account to sync your library and reading progress across devices.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Your name"
            />
          </div>

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
            <label style={labelStyle} htmlFor="confirm-password">Confirm Password</label>
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
              placeholder="Re-enter your password"
            />
            {confirmPassword && !passwordsMatch && (
              <p style={errorStyle}>Passwords do not match.</p>
            )}
          </div>

          {error && <p style={errorStyle}>{error}</p>}

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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

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
          Sign up with Google
        </button>

        <p style={{ fontSize: 12.5, color: "var(--text)", margin: "12px 0 0", lineHeight: 1.5 }}>
          When you sign up with Google, we only use your email address and name
          to create your account. We never post to your Google account or access
          your other Google data.
        </p>

        <p style={{ fontSize: 14, color: "var(--text)", margin: "32px 0 0", textAlign: "center" }}>
          Already have an account?{" "}
          <button
            onClick={() => onNavigate("/signin")}
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
            Sign In
          </button>
        </p>
      </div>

      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}