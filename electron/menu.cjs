const { Menu, app, dialog, shell } = require("electron");
const https = require("node:https");

const isMac = process.platform === "darwin";

const APP_WEBSITE = "https://github.com/LamrotG/NocturaPDF";
const USER_MANUAL_URL = "https://github.com/LamrotG/NocturaPDF#readme";
const RELEASES_URL = "https://github.com/LamrotG/NocturaPDF/releases/latest";
const API_RELEASES_URL =
  "https://api.github.com/repos/LamrotG/NocturaPDF/releases/latest";

// Module-level state — kept in sync with the renderer via updateMenuState().
// The native menu is rebuilt on every change so document-dependent items
// (Close, Save, Print, Properties, …) enable/disable correctly and the Open
// Recent submenu stays in sync with the renderer's recent-files list.
let menuState = {
  hasDoc: false,
  filePath: null,
  recentFiles: [],
};

let mainWindow = null;

function send(action, payload = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("menu:action", { action, ...payload });
  }
}

// Fetches the latest GitHub release and compares it to the running version.
// Runs entirely in the main process — no renderer involvement needed.
function checkForUpdates() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const req = https.get(
    API_RELEASES_URL,
    { headers: { "User-Agent": "NocturaPDF" } },
    (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const release = JSON.parse(body);
          const latest = (release.tag_name || "").replace(/^v/, "");
          const current = app.getVersion();

          if (latest && latest !== current) {
            dialog
              .showMessageBox(mainWindow, {
                type: "info",
                title: "Update Available",
                message: "A new version of NocturaPDF is available",
                detail: `Version ${latest} is available (you have ${current}).`,
                buttons: ["Download", "Later"],
                defaultId: 0,
                cancelId: 1,
              })
              .then((r) => {
                if (r.response === 0) {
                  shell.openExternal(release.html_url || RELEASES_URL);
                }
              });
          } else {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Up to Date",
              message: "NocturaPDF is up to date",
              detail: `Version ${current} is the latest release.`,
            });
          }
        } catch {
          dialog.showErrorBox(
            "Update Check Failed",
            "Could not parse the update information. Please try again later."
          );
        }
      });
    }
  );

  req.on("error", () => {
    dialog.showErrorBox(
      "Update Check Failed",
      "Could not connect to the update server. Please check your internet connection."
    );
  });

  req.setTimeout(10000, () => {
    req.destroy();
    dialog.showErrorBox(
      "Update Check Failed",
      "The request timed out. Please try again later."
    );
  });
}

function buildRecentFilesSubmenu() {
  const files = menuState.recentFiles || [];
  if (files.length === 0) {
    return [{ label: "No Recent Files", enabled: false }];
  }

  const items = files.map((f) => ({
    label: f.name,
    click: () => send("open-recent", { filePath: f.filePath, name: f.name }),
  }));

  items.push({ type: "separator" });
  items.push({
    label: "Clear Recent Files",
    click: () => send("clear-recent"),
  });

  return items;
}

function buildMenuTemplate() {
  const hasDoc = menuState.hasDoc;
  const hasFilePath = Boolean(menuState.filePath);

  // ── File ────────────────────────────────────────────────────────────
  const fileSubmenu = [
    {
      label: "Open…",
      accelerator: "CmdOrCtrl+O",
      click: () => send("open"),
    },
    {
      label: "Close",
      accelerator: "CmdOrCtrl+W",
      enabled: hasDoc,
      click: () => send("close"),
    },
    { type: "separator" },
    {
      label: "Open Recent",
      submenu: buildRecentFilesSubmenu(),
    },
    { type: "separator" },
    {
      label: "Show in Folder",
      enabled: hasFilePath,
      click: () => {
        if (menuState.filePath) shell.showItemInFolder(menuState.filePath);
      },
    },
    { type: "separator" },
    {
      label: "Save",
      accelerator: "CmdOrCtrl+S",
      enabled: hasDoc,
      click: () => send("save"),
    },
    {
      label: "Save As…",
      accelerator: "CmdOrCtrl+Shift+S",
      enabled: hasDoc,
      click: () => send("save-as"),
    },
    { type: "separator" },
    {
      label: "Print…",
      accelerator: "CmdOrCtrl+P",
      enabled: hasDoc,
      click: () => send("print"),
    },
    { type: "separator" },
    {
      label: "Properties",
      accelerator: "Alt+Enter",
      enabled: hasDoc,
      click: () => send("properties"),
    },
  ];

  // On Windows/Linux, Exit lives at the bottom of the File menu.
  // On macOS, Quit lives in the app menu (built below).
  if (!isMac) {
    fileSubmenu.push({ type: "separator" });
    fileSubmenu.push({
      label: "Exit",
      accelerator: "CmdOrCtrl+Q",
      click: () => app.quit(),
    });
  }

  // ── Edit ────────────────────────────────────────────────────────────
  const editSubmenu = [
    { role: "undo" },
    { role: "redo" },
    { type: "separator" },
    { role: "cut" },
    { role: "copy" },
    { role: "paste" },
    { role: "selectAll" },
    { type: "separator" },
    {
      label: "Find",
      accelerator: "CmdOrCtrl+F",
      enabled: hasDoc,
      click: () => send("find"),
    },
    {
      label: "Find Next",
      accelerator: "F3",
      enabled: hasDoc,
      click: () => send("find-next"),
    },
    {
      label: "Find Previous",
      accelerator: "Shift+F3",
      enabled: hasDoc,
      click: () => send("find-previous"),
    },
  ];

  // ── View ────────────────────────────────────────────────────────────
  const viewSubmenu = [
    {
      label: "Zoom In",
      accelerator: "CmdOrCtrl+Plus",
      enabled: hasDoc,
      click: () => send("zoom-in"),
    },
    {
      label: "Zoom Out",
      accelerator: "CmdOrCtrl+-",
      enabled: hasDoc,
      click: () => send("zoom-out"),
    },
    {
      label: "Reset Zoom",
      accelerator: "CmdOrCtrl+0",
      enabled: hasDoc,
      click: () => send("zoom-reset"),
    },
    { type: "separator" },
    {
      label: "Fit to Width",
      enabled: hasDoc,
      click: () => send("fit-width"),
    },
    {
      label: "Fit to Page",
      enabled: hasDoc,
      click: () => send("fit-page"),
    },
    {
      label: "Actual Size",
      enabled: hasDoc,
      click: () => send("actual-size"),
    },
    { type: "separator" },
    {
      label: "Rotate Clockwise",
      enabled: hasDoc,
      click: () => send("rotate-cw"),
    },
    {
      label: "Rotate Counterclockwise",
      enabled: hasDoc,
      click: () => send("rotate-ccw"),
    },
    { type: "separator" },
    {
      label: "Toggle Sidebar",
      enabled: hasDoc,
      click: () => send("toggle-sidebar"),
    },
    {
      label: "Toggle Presentation Mode",
      enabled: hasDoc,
      click: () => send("toggle-presentation"),
    },
    { type: "separator" },
    {
      label: "Toggle Full Screen",
      accelerator: "F11",
      click: () => send("toggle-fullscreen"),
    },
    { type: "separator" },
    { role: "reload" },
    { role: "forceReload" },
    { role: "toggleDevTools" },
  ];

  // ── Help ────────────────────────────────────────────────────────────
  const helpSubmenu = [
    {
      label: "Visit Website",
      click: () => shell.openExternal(APP_WEBSITE),
    },
    {
      label: "User Manual",
      click: () => shell.openExternal(USER_MANUAL_URL),
    },
    {
      label: "Keyboard Shortcuts",
      click: () => send("keyboard-shortcuts"),
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: checkForUpdates,
    },
    { type: "separator" },
    {
      label: `About ${app.getName()}`,
      click: () => send("about"),
    },
  ];

  // ── macOS app menu (custom so we can add "Check for Updates") ───────
  const appMenu = isMac
    ? {
        label: app.name,
        submenu: [
          { label: `About ${app.name}`, role: "about" },
          { type: "separator" },
          { label: "Check for Updates", click: checkForUpdates },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      }
    : null;

  const template = [
    ...(appMenu ? [appMenu] : []),
    { label: "File", submenu: fileSubmenu },
    { label: "Edit", submenu: editSubmenu },
    { label: "View", submenu: viewSubmenu },
    { role: "windowMenu" },
    { label: "Help", submenu: helpSubmenu },
  ];

  return template;
}

function rebuild() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate()));
}

function buildMenu(win) {
  mainWindow = win;
  rebuild();
}

// Called by the renderer (via IPC) whenever document state or the recent-
// files list changes. Merges the patch into menuState and rebuilds the menu.
function updateMenuState(win, patch) {
  mainWindow = win;
  menuState = { ...menuState, ...patch };
  rebuild();
}

module.exports = { buildMenu, updateMenuState };