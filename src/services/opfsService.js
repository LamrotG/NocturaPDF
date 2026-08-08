/**
 * OPFS (Origin Private File System) storage for the Local Library.
 *
 * OPFS gives the app a private, origin-scoped filesystem that persists
 * across sessions and is not visible to the user's normal file system.
 * This is where "Local Library" PDFs live — they stay fully on-device and
 * are never uploaded unless the user explicitly syncs them to the cloud.
 *
 * Files are stored as:
 *   /nocturapdf/<sha256-of-content>.pdf
 *
 * The content hash doubles as the stable `local_key` used to correlate
 * reading metadata in IndexedDB (and later in Supabase when synced).
 */

const ROOT_DIR = "nocturapdf";

async function getRootDir() {
  if (!navigator.storage?.getDirectory) {
    throw new Error("OPFS is not supported in this browser.");
  }
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(ROOT_DIR, { create: true });
}

/**
 * Compute a SHA-256 hex digest of a Uint8Array/ArrayBuffer.
 * Used as the stable local_key for a file.
 */
export async function sha256Hex(data) {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Save a PDF File into OPFS. Returns { key, name, size }.
 */
export async function saveLocalPdf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const key = await sha256Hex(bytes);

  const dir = await getRootDir();
  const handle = await dir.getFileHandle(`${key}.pdf`, { create: true });
  const writable = await handle.createWritable();
  await writable.write(bytes);
  await writable.close();

  return { key, name: file.name, size: bytes.byteLength };
}

/**
 * Read a PDF back from OPFS as a File object (suitable for pdf.js).
 */
export async function readLocalPdf(key, name = "document.pdf") {
  const dir = await getRootDir();
  const handle = await dir.getFileHandle(`${key}.pdf`);
  const file = await handle.getFile();
  return new File([file], name, { type: "application/pdf" });
}

/**
 * Delete a PDF from OPFS.
 */
export async function deleteLocalPdf(key) {
  const dir = await getRootDir();
  try {
    await dir.removeEntry(`${key}.pdf`);
  } catch {
    // Entry may not exist — ignore.
  }
}

/**
 * List all PDFs in the Local Library.
 * Returns [{ key, name, size, lastModified }].
 */
export async function listLocalPdfs() {
  const dir = await getRootDir();
  const entries = [];
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "file" && name.endsWith(".pdf")) {
      const file = await handle.getFile();
      entries.push({
        key: name.replace(/\.pdf$/, ""),
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      });
    }
  }
  return entries;
}

/**
 * Check whether OPFS is available in this browser.
 */
export function isOpfsSupported() {
  return Boolean(navigator.storage?.getDirectory);
}