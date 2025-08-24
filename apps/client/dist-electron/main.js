import { app, BrowserWindow, protocol, net, ipcMain } from "electron";
import { createRequire } from "node:module";
import url, { fileURLToPath } from "node:url";
import path from "node:path";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 860,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      enableBlinkFeatures: "WebRTC",
      preload: path.join(__dirname, "preload.mjs"),
      devTools: true,
      webSecurity: false
    },
    frame: false
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", new Date().toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "frontend/index.html"));
  }
  win.webContents.openDevTools();
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  protocol.handle("local", (request) => {
    const filePath = request.url.slice("local://".length);
    console.log("🚀 ~ filePath:", filePath);
    return net.fetch(url.pathToFileURL(path.join(__dirname, filePath)).toString());
  });
});
ipcMain.on("window-minimize", () => {
  if (win)
    win.minimize();
});
ipcMain.on("window-maximize", () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});
ipcMain.on("window-close", () => {
  if (win)
    win.close();
});
ipcMain.handle("window-is-maximized", () => {
  return win ? win.isMaximized() : false;
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
