const path = require("node:path");
const fs = require("node:fs/promises");
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { buildMenu } = require("./menu.cjs");

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
ipcMain.handle("read-file", async (event, filePath) => {
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

ipcMain.handle("open-file-explorer", async (event, filePath) => {
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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
