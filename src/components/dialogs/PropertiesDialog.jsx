import React, { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function getMetadataValue(metadata, key) {
  if (!metadata) return "";
  if (typeof metadata.get === "function") {
    return metadata.get(key) || "";
  }
  if (typeof metadata === "object") {
    const direct = metadata[key];
    if (typeof direct === "string" && direct) return direct;
    const lower = metadata[key.toLowerCase()];
    if (typeof lower === "string" && lower) return lower;
  }
  return "";
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--text)", fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: "var(--text-h)",
          fontSize: 13,
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Shows document information: filename, path, size, page count, PDF metadata,
// and creation/modification dates. Merges File API info with pdf.js metadata.
export default function PropertiesDialog({ open, onClose, file, pdfDoc, numPages }) {
  const [pdfMeta, setPdfMeta] = useState(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      // Reset previous data when opening
      setPdfMeta(null);

      // PDF metadata from pdf.js
      if (pdfDoc) {
        try {
          const meta = await pdfDoc.getMetadata();
          if (!cancelled) setPdfMeta(meta);
        } catch {
          /* ignore */
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, file, pdfDoc]);

  const name = file?.name || "—";
  const filePath = "—";
  const size = file?.size ?? null;
  const createdAt = null;
  const modifiedAt = null;
  const info = pdfMeta?.info || {};
  const metadata = pdfMeta?.metadata || {};
  const titleValue = info.Title || getMetadataValue(metadata, "dc:title") || "—";
  const authorValue = info.Author || getMetadataValue(metadata, "dc:creator") || "—";
  const subjectValue = info.Subject || getMetadataValue(metadata, "dc:description") || "—";

  return (
    <Modal open={open} onClose={onClose} title="Document Properties" width={520}>
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            margin: "0 0 4px",
          }}
        >
          General
        </h3>
        <Row label="File name" value={name} />
        <Row label="Location" value={filePath} />
        <Row label="Size" value={formatBytes(size)} />
        <Row label="Pages" value={numPages || "—"} />
        {createdAt && <Row label="Created" value={formatDate(createdAt)} />}
        {modifiedAt && <Row label="Modified" value={formatDate(modifiedAt)} />}
      </div>

      <div>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            margin: "0 0 4px",
          }}
        >
          PDF Metadata
        </h3>
        <Row label="Title" value={titleValue} />
        <Row label="Author" value={authorValue} />
        <Row label="Subject" value={subjectValue} />
        <Row label="Keywords" value={info.Keywords || "—"} />
        <Row label="Creator" value={info.Creator || "—"} />
        <Row label="Producer" value={info.Producer || "—"} />
        <Row label="PDF Version" value={info.PDFFormatVersion || "—"} />
        {info.CreationDate && (
          <Row label="PDF Created" value={formatDate(info.CreationDate)} />
        )}
        {info.ModDate && <Row label="PDF Modified" value={formatDate(info.ModDate)} />}
      </div>
    </Modal>
  );
}