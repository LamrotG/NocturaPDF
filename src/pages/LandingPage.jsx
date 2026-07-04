import React from "react";
import "./landing.css";
import SiteHeader from "../components/layout/SiteHeader.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import {
  FocusIcon,
  InstantIcon,
  MinimalIcon,
  NoAccountIcon,
  OfflineIcon,
  SpeedIcon,
} from "../components/common/icons.jsx";

const FEATURES = [
  {
    icon: OfflineIcon,
    title: "Always Free",
    description: "Offline PDF reading at no cost, with no premium tier.",
  },
  {
    icon: NoAccountIcon,
    title: "No Account Required",
    description: "Open a file and start reading. No sign up, no login.",
  },
  {
    icon: InstantIcon,
    title: "Instant Access",
    description: "No setup steps. Just open a file and read.",
  },
  {
    icon: MinimalIcon,
    title: "Minimal Interface",
    description: "A clean layout that keeps focus on your document.",
  },
  {
    icon: SpeedIcon,
    title: "Fast Performance",
    description: "Smooth scrolling and zoom, even on large files.",
  },
  {
    icon: FocusIcon,
    title: "Distraction Free",
    description: "A calm reading environment with nothing pulling your attention.",
  },
];

function Hero({ onStartReading, onNavigate }) {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "96px 24px 72px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: 44,
          lineHeight: 1.15,
          letterSpacing: -0.5,
          margin: "0 0 16px",
          color: "var(--text-h)",
        }}
      >
        A dark, focused space for long reads.
      </h1>
      <p style={{ fontSize: 17, color: "var(--text)", margin: "0 0 40px" }}>
        Built for students and professionals reading long PDFs. Dark mode reduces
        eye strain and keeps the page calm, clear, and free of distraction.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          className="np-btn-primary"
          onClick={onStartReading}
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
          Start Reading in Browser
        </button>
        <button
          onClick={() => onNavigate("/download")}
          style={{
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
          Get App
        </button>
      </div>
    </div>
  );
}

function Features() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text-h)",
          textAlign: "center",
          margin: "0 0 32px",
        }}
      >
        Features
      </h2>

      <div className="np-features-grid">
        {FEATURES.map(({ icon, title, description }) => (
          <div
            key={title}
            className="np-feature-card"
            style={{
              padding: 20,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--code-bg)",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--accent-bg)",
                color: "var(--accent)",
                marginBottom: 14,
              }}
            >
              {React.createElement(icon, { size: 20 })}
            </span>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-h)", marginBottom: 6 }}>
              {title}
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>{description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage({ onStartReading, onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader onNavigate={onNavigate} />
      <Hero onStartReading={onStartReading} onNavigate={onNavigate} />
      <Features />
      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
