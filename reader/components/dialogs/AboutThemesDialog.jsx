import React from "react";
import Modal from "../Modal.jsx";
import { PDF_COLOR_MODE_ORDER, PDF_COLOR_MODES } from "../../utils/constants.js";

export default function AboutThemesDialog({ open, onClose }) {
  const themes = PDF_COLOR_MODE_ORDER.map((id) => PDF_COLOR_MODES[id]).filter(Boolean);
  return <Modal open={open} onClose={onClose} title="About Themes" width={620}>
    <p style={{ marginTop: 0, lineHeight: 1.5 }}>
      Themes change how a PDF looks while reading. Choose <strong>Original</strong> when you want the document to look exactly as it was created. For everyday reading, <strong>Smart</strong> provides a balanced experience.
    </p>
    <div style={{ display: "grid", gap: 10 }}>
      {themes.map((t) => <div key={t.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
        <div style={{ color: "var(--text-h)", fontWeight: 600 }}>{t.label} <span style={{ opacity: .65, fontWeight: 400 }}>— {t.summary}</span></div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45 }}>{t.detail}</div>
      </div>)}
    </div>
  </Modal>;
}