const { contextBridge, ipcRenderer } = require("electron");

// `isElectron` lets the renderer know it's running as the desktop app (rather
// than in a regular browser tab) so it can skip the marketing site and open
// straight into the reader.
//
// `readFile` - Reads a file from disk and returns as Uint8Array
// `openFileExplorer` - Opens a file/folder location in the file explorer
contextBridge.exposeInMainWorld("nocturaPdf", { 
  isElectron: true,
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  openFileExplorer: (filePath) => ipcRenderer.invoke("open-file-explorer", filePath),
});
