import { app, ipcMain, BrowserWindow, dialog, OpenDialogOptions, SaveDialogOptions, protocol, net } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFile, writeFile, copyFile, mkdir } from "fs/promises";
import path from "node:path";
import fs from "node:fs";
import url from "node:url";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

protocol.registerSchemesAsPrivileged([
	{
		scheme: "fp-file",
		privileges: {
			secure: true,
			supportFetchAPI: true,
			standard: true,
			bypassCSP: true,
			stream: true,
		},
	},
]);

// 处理单例启动
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
	app.quit();
} else {
	app.on("second-instance", (event, commandLine) => {
		if (win) {
			if (win.isMinimized()) win.restore();
			win.focus();

			const filePath = getFileFromArgv(commandLine);
			if (filePath) {
				// 热启动：此时 Vue 肯定加载完了，直接发
				win.webContents.send("open-map-file", filePath);
			}
		}
	});
}

autoUpdater.logger = log;
autoUpdater.autoDownload = false; // 关键：设为 false，防止游戏过程中自动抢网速
autoUpdater.autoInstallOnAppQuit = true; // 退出时自动安装

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

const isProduction = app.isPackaged;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let win: BrowserWindow | null;

// 处理文件启动
// 1. 定义暂存变量
let fileToOpen: string | null = null;

// 2. 辅助函数：解析命令行参数 (Windows)
function getFileFromArgv(argv: string[]) {
	// 生产环境通常 argv[1] 是文件路径
	const possibleFile = argv[1];
	if (possibleFile && possibleFile.endsWith(".fpmap")) {
		return possibleFile;
	}
	return null;
}

// 3. 冷启动检查 (Windows)
if (process.platform !== "darwin") {
	fileToOpen = getFileFromArgv(process.argv);
}

function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 860,
		webPreferences: {
			nodeIntegration: true,
			nodeIntegrationInWorker: false,
			preload: path.join(__dirname, "preload.mjs"),
			devTools: isProduction ? false : true,
			webSecurity: true,
			zoomFactor: 1.0,
		},
		frame: false,
	});

	win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				"Content-Security-Policy": [
					"default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: fp-file: ws: http: https:",
				],
			},
		});
	});

	if (!isProduction) win.webContents.openDevTools();

	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", new Date().toLocaleString());
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		// win.loadFile("./dist/index.html");
		win.loadFile(path.join(RENDERER_DIST, "frontend/index.html"));
	}

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

	ipcMain.on("renderer-ready", (event) => {
		console.log("Vue is ready.");
		if (fileToOpen) {
			console.log("Sending cached file to renderer:", fileToOpen);
			event.sender.send("open-map-file", fileToOpen);
			fileToOpen = null; // 发送完清空
		}
	});
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		cleanTempDir();
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
	protocol.handle("fp-file", (request) => {
		// 1. 截取协议头
		let urlPath = request.url.slice("fp-file://".length);

		// 2. 处理 Windows 盘符丢失冒号的问题
		if (process.platform === "win32") {
			urlPath = decodeURIComponent(urlPath);

			// 场景 A: "c/DEV/..." -> 补全为 "c:/DEV/..."
			if (/^[a-zA-Z]\//.test(urlPath)) {
				// 在第1个字符后插入冒号
				urlPath = urlPath.slice(0, 1) + ":" + urlPath.slice(1);
			}

			// 场景 B: "/c:/DEV/..." (有时候浏览器会保留斜杠) -> 去掉开头的 "/"
			else if (urlPath.startsWith("/") && /^[a-zA-Z]:/.test(urlPath.slice(1))) {
				urlPath = urlPath.slice(1);
			}

			// 场景 C: 已经是 "c:/DEV/..." (正常) -> 不做处理
		} else {
			urlPath = decodeURIComponent(urlPath);
		}

		// 3. 最终清洗：确保是标准路径分隔符
		const finalPath = path.normalize(urlPath);
		try {
			return net.fetch(pathToFileURL(finalPath).toString());
		} catch (error) {
			console.error("❌ [fp-file] 加载失败:", finalPath, error);
			return new Response("Invalid Path", { status: 400 });
		}
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

// ipcMain.on("window-unmaximize", () => {
// 	if (win) win.unmaximize();
// });

ipcMain.on("window-close", () => {
	if (win) win.close();
});

ipcMain.handle("window-is-maximized", () => {
	return win ? win.isMaximized() : false;
});

ipcMain.handle("read-file", async (event, path: string) => {
	return await readFile(path);
});

ipcMain.handle("write-file", async (event, targetPath: string, data: string) => {
	await writeFile(targetPath, data);
	return targetPath;
});

ipcMain.handle("write-local-file", async (event, targetPath: string, data: Uint8Array) => {
	const finalPath = path.isAbsolute(targetPath) ? targetPath : path.join(process.cwd(), targetPath);
	const dir = path.dirname(finalPath);
	await mkdir(dir, { recursive: true });
	await writeFile(finalPath, data);
	return finalPath;
});

ipcMain.handle("copy-file", async (event, fromFilePath: string, toFilePathtoFilePath: string, newFileName: string) => {
	if (!toFilePathtoFilePath) {
		toFilePathtoFilePath = path.join(process.cwd(), "temp");
		fs.mkdirSync(toFilePathtoFilePath, { recursive: true }); // 如果目录不存在则创建
	}

	const fileType = path.extname(fromFilePath);
	const newFilePath = path.join(toFilePathtoFilePath, newFileName + fileType);

	fs.copyFileSync(fromFilePath, newFilePath);

	return { filePath: newFilePath, fileType: fileType.slice(1) };
});

ipcMain.handle("get-image-base64", async (event, filePath) => {
	const fileContent = await readFile(filePath);
	return fileContent.toString("base64");
});

ipcMain.handle("clear-temp-dir", async (event) => {
	await cleanTempDir();
});

ipcMain.handle("open-load-dialog", async (event, options: OpenDialogOptions) => {
	return await dialog.showOpenDialog(options);
});

ipcMain.handle("open-save-dialog", async (event, options: SaveDialogOptions) => {
	return await dialog.showSaveDialog(options);
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

export async function cleanTempDir() {
	const tempDir = path.join(process.cwd(), "temp");

	try {
		// 1. 检查目录是否存在
		await fs.accessSync(tempDir);

		// 2. 读取目录内容
		const files = await fs.readdirSync(tempDir);

		// 3. 并行删除所有文件和子目录
		await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(tempDir, file);
				const stats = await fs.statSync(filePath);

				if (stats.isDirectory()) {
					await fs.rmSync(filePath, { recursive: true }); // 删除子目录
				} else {
					await fs.unlinkSync(filePath); // 删除文件
				}
			}),
		);

		console.log(`已清空临时目录: ${tempDir}`);
	} catch (error: any) {
		if (error.code === "ENOENT") {
			console.log("临时目录不存在，无需清理");
		} else {
			console.error("清理临时目录失败:", error);
		}
	}
}
