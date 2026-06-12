const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const APP_URL = "https://nuvix-xi.vercel.app";

function findIcon() {
  const candidates = [
    path.join(process.cwd(), "icone.ico"),
    path.join(process.cwd(), "icone.png"),
    path.join(process.resourcesPath || "", "icone.ico"),
    path.join(process.resourcesPath || "", "icone.png"),
    path.join(process.cwd(), "public", "brand", "nuvix-logo.png"),
    path.join(process.resourcesPath || "", "public", "brand", "nuvix-logo.png"),
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function createWindow() {
  const icon = findIcon();
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "Nuvix",
    icon,
    autoHideMenuBar: true,
    backgroundColor: "#f6f3ee",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.loadURL(APP_URL);

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.setName("Nuvix");

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
