const { Menu, app, dialog } = require("electron");

const isMac = process.platform === "darwin";

// Native OS menu essentials only (open/quit, standard edit/view roles).
// The app's own File/Edit/View/Help menu bar (TopAppBar.jsx) is the one
// users see — this native menu stays registered but hidden (see
// autoHideMenuBar in main.cjs) purely so its keyboard accelerators
// (Ctrl+Z, Ctrl+R, F11, ...) keep working.
function buildMenu(win) {
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    {
      label: "Help",
      submenu: [
        {
          label: "About NocturaPDF",
          click: () =>
            dialog.showMessageBox(win, {
              type: "info",
              title: "About NocturaPDF",
              message: "NocturaPDF",
              detail: `Version ${app.getVersion()}`,
            }),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { buildMenu };
