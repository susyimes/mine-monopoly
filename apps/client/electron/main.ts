import { app, ipcMain, BrowserWindow, dialog, OpenDialogOptions, SaveDialogOptions, protocol, net } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs/promises";
import url from "node:url";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

autoUpdater.logger = log;
autoUpdater.autoDownload = false; // 关键：设为 false，防止游戏过程中自动抢网速
autoUpdater.autoInstallOnAppQuit = true; // 退出时自动安装

log.transports.file.level = "info";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 780,
		minWidth: 1200,
		minHeight: 780,
		webPreferences: {
			nodeIntegration: true,
			nodeIntegrationInWorker: false,
			contextIsolation: true,
			enableBlinkFeatures: "WebRTC",
			preload: path.join(__dirname, "preload.mjs"),
			devTools: true,
			webSecurity: false,
		},
		frame: false,
	});

	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", new Date().toLocaleString());
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		// win.loadFile("./dist/index.html");
		win.loadFile(path.join(RENDERER_DIST, "frontend/index.html"));
	}

	win.webContents.openDevTools();

	win.on("enter-full-screen", () => {
		win!.webContents.send("fullscreen-changed", true);
	});

	win.on("leave-full-screen", () => {
		win!.webContents.send("fullscreen-changed", false);
	});

	autoUpdater.on("update-available", (info) => {
		win && win.webContents.send("update-status", { status: "available", info });
	});

	// 已经是最新
	autoUpdater.on("update-not-available", (info) => {
		win && win.webContents.send("update-status", { status: "not-available", info });
	});

	// 下载进度
	autoUpdater.on("download-progress", (progressObj) => {
		win && win.webContents.send("update-status", { status: "progress", progress: progressObj });
	});

	// 下载完成
	autoUpdater.on("update-downloaded", (info) => {
		win && win.webContents.send("update-status", { status: "downloaded", info });
	});

	// 错误
	autoUpdater.on("error", (err) => {
		win && win.webContents.send("update-status", { status: "error", error: err.message });
	});
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
		return net.fetch(url.pathToFileURL(path.join(__dirname, filePath)).toString());
	});
});

ipcMain.on("window-minimize", () => {
	if (win) win.minimize();
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
	if (win) win.close();
});

ipcMain.handle("window-is-maximized", () => {
	return win ? win.isMaximized() : false;
});

const cacheDir = path.join(app.getAppPath(), "map-cache");
const indexFile = path.join(cacheDir, "index.json");
type IndexData = Record<string, string>;

async function loadIndex(): Promise<IndexData> {
	try {
		const raw = await fs.readFile(indexFile, "utf-8");
		return JSON.parse(raw) as IndexData;
	} catch {
		return {};
	}
}

ipcMain.handle("map-cache:save", async (_event, mapId: string, hash: string, buffer: ArrayBuffer) => {
	async function ensureCacheDir() {
		await fs.mkdir(cacheDir, { recursive: true });
	}

	async function saveIndex(index: IndexData) {
		await fs.writeFile(indexFile, JSON.stringify(index, null, 2), "utf-8");
	}

	await ensureCacheDir();
	const index = await loadIndex();
	const oldHash = index[mapId];

	// 删除旧文件
	if (oldHash && oldHash !== hash) {
		const oldFilePath = path.join(cacheDir, `${mapId}-${oldHash}.bin`);
		await fs.rm(oldFilePath, { force: true }).catch(() => {});
	}

	const filePath = path.join(cacheDir, `${mapId}-${hash}.bin`);
	await fs.writeFile(filePath, new Uint8Array(buffer));

	index[mapId] = hash;
	await saveIndex(index);
});

ipcMain.handle("map-cache:load", async (_event, mapId: string, hash: string) => {
	const index = await loadIndex();
	if (index[mapId] !== hash) return undefined;

	const filePath = path.join(cacheDir, `${mapId}-${hash}.bin`);
	try {
		const buf = await fs.readFile(filePath);
		return buf.buffer;
	} catch {
		return undefined;
	}
});

// A. 检查更新（可以由前端触发，也可以启动时触发）
ipcMain.handle("check-for-update", () => {
	if (!app.isPackaged) return "dev-mode"; // 开发环境不检查
	return autoUpdater.checkForUpdates();
});

// B. 开始下载
ipcMain.handle("start-download-update", () => {
	autoUpdater.downloadUpdate();
});

// C. 退出并安装
ipcMain.handle("quit-and-install", () => {
	autoUpdater.quitAndInstall();
});

app.whenReady().then(createWindow);
