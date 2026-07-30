const { contextBridge, ipcRenderer } = require("electron");

// `isElectron` lets the renderer know it's running as the desktop app (rather
// than in a regular browser tab) so it can skip the marketing site and open
// straight into the reader.
//
// File operations:
//   `openFileDialog` - Opens native file dialog supporting multiple file selection
//   `readFile`       - Reads a file from disk and returns as Uint8Array
//   `saveFile`       - Writes data to disk (Save As dialog if no path given)
//   `getFileInfo`    - Returns file stats for the Properties dialog
//   `getAppInfo`     - Returns app/runtime metadata for the About dialog
//
// Shell:
//   `openFileExplorer` - Reveals a file in the system file explorer
//   `openExternal`     - Opens a URL in the user's default browser
//
// Menu bridge:
//   `onMenuAction`     - Subscribes to native menu clicks (returns unsubscribe)
//   `updateMenuState`  - Pushes doc/recent-files state to the native menu
contextBridge.exposeInMainWorld("nocturaPdf", {
  isElectron: true,

  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  saveFile: (data, filePath) => ipcRenderer.invoke("save-file", data, filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke("get-file-info", filePath),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),

  openFileExplorer: (filePath) => ipcRenderer.invoke("open-file-explorer", filePath),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  onMenuAction: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("menu:action", handler);
    return () => ipcRenderer.removeListener("menu:action", handler);
  },
  updateMenuState: (patch) => ipcRenderer.invoke("update-menu-state", patch),
});