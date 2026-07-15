const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const { buildMenu } = require("./menu.cjs");

const DEV_SERVER_URL = "http://localhost:5173";
const DEV_RETRY_DELAY_MS = 500;
const DEV_RETRY_ATTEMPTS = 20;

// The Vite dev server may still be starting when `npm run electron` is
// launched alongside it, so retry briefly instead of adding a wait-on-style
// dependency just for local development convenience.
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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
