const { contextBridge } = require("electron");

// `isElectron` lets the renderer know it's running as the desktop app (rather
// than in a regular browser tab) so it can skip the marketing site and open
// straight into the reader. No other renderer-facing APIs needed yet, but the
// bridge exists so a future feature (native file dialogs, etc.) has a secure
// place to attach to without ever loosening contextIsolation or enabling
// nodeIntegration in the renderer.
contextBridge.exposeInMainWorld("nocturaPdf", { isElectron: true });
