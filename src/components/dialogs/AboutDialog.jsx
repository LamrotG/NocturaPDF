import React, { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";

const APP_INFO_FALLBACK = {
  name: "NocturaPDF",
  version: "0.1.0",
  author: "Lamrot Gashaw",
  license: "MIT",
  website: "https://github.com/LamrotG/NocturaPDF",
};
const APP_DESCRIPTION = "A dark, focused, offline PDF reader";

// Displays application information: name, version, author, license, and
// runtime details (Electron/Chrome/Node versions) when running in Electron.
export default function AboutDialog({ open, onClose }) {
  const [appInfo, setAppInfo] = useState(APP_INFO_FALLBACK);

  useEffect(() => {
    if (!open) return;
    if (window.nocturaPdf?.getAppInfo) {
      window.nocturaPdf
        .getAppInfo()
        .then((result) => {
          if (result.success) {
            setAppInfo((prev) => ({ ...prev, ...result.info }));
          }
        })
        .catch(() => {});
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={`About ${appInfo.name}`} width={440}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 16px",
            borderRadius: 16,
            background: "var(--accent-bg)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          N
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, color: "var(--text-h)" }}>
          {appInfo.name}
        </h2>
        <p style={{ color: "var(--text)", fontSize: 14, margin: "0 0 4px" }}>
          Version {appInfo.version}
        </p>
        <p style={{ color: "var(--text)", fontSize: 13, margin: 0 }}>
          {APP_DESCRIPTION}
        </p>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "var(--text)" }}>Author</span>
          <span style={{ color: "var(--text-h)" }}>{appInfo.author}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "var(--text)" }}>License</span>
          <span style={{ color: "var(--text-h)" }}>{appInfo.license}</span>
        </div>
        {appInfo.electron && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text)" }}>Electron</span>
            <span style={{ color: "var(--text-h)" }}>{appInfo.electron}</span>
          </div>
        )}
        {appInfo.chrome && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text)" }}>Chrome</span>
            <span style={{ color: "var(--text-h)" }}>{appInfo.chrome}</span>
          </div>
        )}
        {appInfo.node && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text)" }}>Node.js</span>
            <span style={{ color: "var(--text-h)" }}>{appInfo.node}</span>
          </div>
        )}
        {appInfo.platform && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text)" }}>Platform</span>
            <span style={{ color: "var(--text-h)" }}>
              {appInfo.platform} {appInfo.arch}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <a
          href={appInfo.website}
          onClick={(e) => {
            e.preventDefault();
            if (window.nocturaPdf?.openExternal) {
              window.nocturaPdf.openExternal(appInfo.website);
            } else {
              window.open(appInfo.website, "_blank");
            }
          }}
          style={{
            color: "var(--accent)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          {appInfo.website}
        </a>
      </div>
    </Modal>
  );
}