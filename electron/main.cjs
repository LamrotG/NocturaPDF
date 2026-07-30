const path = require("node:path");
const fs = require("node:fs/promises");
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const { buildMenu, updateMenuState } = require("./menu.cjs");

const DEV_SERVER_URL = "http://localhost:5173";
const DEV_RETRY_DELAY_MS = 500;
const DEV_RETRY_ATTEMPTS = 20;


function loadDevServerWithRetry(win, attemptsLeft) {
  win.loadURL(DEV_SERVER_URL).catch(() => {
    if (attemptsLeft <= 0) return;
    setTimeout(() => loadDevServerWithRetry(win, attemptsLeft - 1), DEV_RETRY_DELAY_MS);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: "#16171d",
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    // The app renders its own File/Edit/View/Help bar in TopAppBar.jsx, so
    // the native menu (still built below for keyboard accelerators like
    // Ctrl+Z / Ctrl+R / F11) stays registered but hidden rather than drawn
    // as a second bar. Alt reveals it if needed.
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "ppreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  buildMenu(win);

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    loadDevServerWithRetry(win, DEV_RETRY_ATTEMPTS);
  }
}

// IPC handlers for file operations
ipcMain.handle("read-file", async (_event, filePath) => {
  if (!filePath) {
    return { success: false, error: "No file path provided" };
  }
  try {
    const data = await fs.readFile(filePath);
    // Convert to array format for transferable
    return { success: true, data: Array.from(data) };
  } catch (error) {
    console.error("Failed to read file:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("open-file-explorer", async (_event, filePath) => {
  if (!filePath) return { success: false, error: "No file path provided" };
  try {
    // Show the file in the file explorer and select it
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error("Failed to open file explorer:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("open-external", async (_event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error("Failed to open external URL:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("open-file-dialog", async (_event) => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      return { success: false, error: "No window focused" };
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "PDF Documents", extensions: ["pdf"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    // Read all selected files
    const filesData = await Promise.all(
      result.filePaths.map(async (filePath) => {
        try {
          const data = await fs.readFile(filePath);
          return {
            filePath,
            name: path.basename(filePath),
            data: Array.from(data),
          };
        } catch (error) {
          console.error(`Failed to read file ${filePath}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed reads
    const validFiles = filesData.filter((f) => f !== null);

    if (validFiles.length === 0) {
      return { success: false, error: "Failed to read selected files" };
    }

    return { success: true, files: validFiles };
  } catch (error) {
    console.error("Failed to open file dialog:", error);
    return { success: false, error: error.message };
  }
});

// Save data to disk. If no path is provided, shows a Save As dialog.
ipcMain.handle("save-file", async (_event, data, filePath) => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow();
    let targetPath = filePath;

    if (!targetPath) {
      if (!mainWindow) {
        return { success: false, error: "No window focused" };
      }
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Save PDF",
        defaultPath: "Untitled.pdf",
        filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
      });
      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }
      targetPath = result.filePath;
    }

    const buffer = Buffer.from(data);
    await fs.writeFile(targetPath, buffer);
    return { success: true, filePath: targetPath };
  } catch (error) {
    console.error("Failed to save file:", error);
    return { success: false, error: error.message };
  }
});

// Returns file stats + PDF metadata for the Properties dialog.
ipcMain.handle("get-file-info", async (_event, filePath) => {
  if (!filePath) {
    return { success: false, error: "No file path provided" };
  }
  try {
    const stats = await fs.stat(filePath);
    return {
      success: true,
      info: {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        accessedAt: stats.atime.toISOString(),
        isFile: stats.isFile(),
      },
    };
  } catch (error) {
    console.error("Failed to get file info:", error);
    return { success: false, error: error.message };
  }
});

// Returns app metadata for the About dialog.
ipcMain.handle("get-app-info", async () => {
  return {
    success: true,
    info: {
      name: app.getName(),
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch,
    },
  };
});

// Updates the native menu's document/recent-files state from the renderer.
ipcMain.handle("update-menu-state", async (_event, patch) => {
  const win = BrowserWindow.getFocusedWindow();
  updateMenuState(win, patch);
  return { success: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});