const { Menu, app, dialog } = require("electron");

const isMac = process.platform === "darwin";

// Native OS menu essentials only (open/quit, standard edit/view roles) —
// the app's own File/Edit/View/Help menus live inside the web UI
// (TopAppBar.jsx) and are unrelated to this. Kept minimal per the product's
// own "minimal dependencies, no feature bloat" philosophy.
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
