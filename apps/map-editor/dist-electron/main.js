import { app as l, BrowserWindow as p, protocol as T, net as g, ipcMain as t, dialog as f } from "electron";
import { createRequire as S } from "node:module";
import _, { fileURLToPath as E } from "node:url";
import { readFile as u, writeFile as y } from "fs/promises";
import o from "node:path";
import r from "node:fs";
S(import.meta.url);
const m = o.dirname(E(import.meta.url));
process.env.APP_ROOT = o.join(m, "..");
const d = process.env.VITE_DEV_SERVER_URL, z = o.join(process.env.APP_ROOT, "dist-electron"), h = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = d ? o.join(process.env.APP_ROOT, "public") : h;
let n;
function v() {
  n = new p({
    width: 1200,
    height: 860,
    webPreferences: {
      nodeIntegration: !0,
      nodeIntegrationInWorker: !1,
      preload: o.join(m, "preload.mjs"),
      devTools: !0,
      webSecurity: !1
    },
    frame: !1
  }), n.webContents.on("did-finish-load", () => {
    n == null || n.webContents.send("main-process-message", new Date().toLocaleString());
  }), d ? n.loadURL(d) : n.loadFile(o.join(h, "frontend/index.html")), n.webContents.openDevTools();
}
l.on("window-all-closed", () => {
  process.platform !== "darwin" && (R(), l.quit(), n = null);
});
l.on("activate", () => {
  p.getAllWindows().length === 0 && v();
});
l.whenReady().then(() => {
  T.handle("local", (i) => {
    const e = i.url.slice(8);
    return console.log("🚀 ~ filePath:", e), g.fetch(_.pathToFileURL(o.join(m, e)).toString());
  });
});
t.on("window-minimize", () => {
  n && n.minimize();
});
t.on("window-maximize", () => {
  n && (n.isMaximized() ? n.unmaximize() : n.maximize());
});
t.on("window-close", () => {
  n && n.close();
});
t.handle("window-is-maximized", () => n ? n.isMaximized() : !1);
t.handle("read-file", async (i, e) => await u(e));
t.handle("write-file", async (i, e, a) => (await y(e, a), e));
t.handle("write-local-file", async (i, e, a) => (e = o.join(process.cwd(), e), await y(e, a), e));
t.handle("copy-file", async (i, e, a, s) => {
  a || (a = o.join(process.cwd(), "temp"), r.mkdirSync(a, { recursive: !0 }));
  const c = o.extname(e), w = o.join(a, s + c);
  return r.copyFileSync(e, w), { filePath: w, fileType: c.slice(1) };
});
t.handle("get-image-base64", async (i, e) => (await u(e)).toString("base64"));
t.handle("clear-temp-dir", async (i) => {
  await R();
});
t.handle("open-load-dialog", async (i, e) => await f.showOpenDialog(e));
t.handle("open-save-dialog", async (i, e) => await f.showSaveDialog(e));
l.whenReady().then(v);
async function R() {
  const i = o.join(process.cwd(), "temp");
  try {
    await r.accessSync(i);
    const e = await r.readdirSync(i);
    await Promise.all(
      e.map(async (a) => {
        const s = o.join(i, a);
        (await r.statSync(s)).isDirectory() ? await r.rmSync(s, { recursive: !0 }) : await r.unlinkSync(s);
      })
    ), console.log(`已清空临时目录: ${i}`);
  } catch (e) {
    e.code === "ENOENT" ? console.log("临时目录不存在，无需清理") : console.error("清理临时目录失败:", e);
  }
}
export {
  z as MAIN_DIST,
  h as RENDERER_DIST,
  d as VITE_DEV_SERVER_URL,
  R as cleanTempDir
};
