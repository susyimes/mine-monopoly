import { ipcRenderer, contextBridge } from "electron";
import { version } from "../package.json";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("electronAPI", {
	//窗口事件相关
	minimize: () => ipcRenderer.send("window-minimize"),
	isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
	maximize: () => ipcRenderer.send("window-maximize"),
	unmaximize: () => ipcRenderer.send("window-unmaximize"),
	close: () => ipcRenderer.send("window-close"),
	getVersion: () => version,
	onFullScreenChange: (callback: (isFull: boolean) => void) =>
		ipcRenderer.on("fullscreen-changed", (_, isFull) => callback(isFull)),
});

contextBridge.exposeInMainWorld("mapCacheLoader", {
	async save(mapId: string, hash: string, arrayBuffer: ArrayBuffer): Promise<void> {
		await ipcRenderer.invoke("map-cache:save", mapId, hash, arrayBuffer);
	},
	async load(mapId: string, hash: string): Promise<ArrayBuffer | undefined> {
		const buffer = await ipcRenderer.invoke("map-cache:load", mapId, hash);
		if (buffer) {
			return buffer;
		}
		return undefined;
	},
});

contextBridge.exposeInMainWorld("updateAPI", {
	// 触发操作
	checkForUpdate: () => ipcRenderer.invoke("check-for-update"),
	startDownload: () => ipcRenderer.invoke("start-download-update"),
	quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),

	// 监听状态
	onUpdateStatus: (callback: (data: any) => void) => {
		const subscription = (_: any, value: any) => callback(value);
		ipcRenderer.on("update-status", subscription);
		// 返回清理函数
		return () => ipcRenderer.removeListener("update-status", subscription);
	},
});
