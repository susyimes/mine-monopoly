import {
	ipcRenderer,
	contextBridge,
	OpenDialogOptions,
	SaveDialogOptions,
	OpenDialogReturnValue,
	SaveDialogReturnValue,
} from "electron";
import { version } from "../package.json";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("electronAPI", {
	//窗口事件相关
	minimize: () => ipcRenderer.send("window-minimize"),
	isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
	maximize: () => ipcRenderer.send("window-maximize"),
	unmaximize: () => ipcRenderer.send("window-unmaximize"),
	close: () => ipcRenderer.send("window-close"),

	//文件操作相关
	readFile: async (filePath: string) => ipcRenderer.invoke("read-file", filePath),
	saveFile: async (filePath: string, data: string): Promise<string> => ipcRenderer.invoke("write-file", filePath, data),
	saveLocalFile: async (filePath: string, data: string): Promise<string> =>
		ipcRenderer.invoke("write-local-file", filePath, data),
	copyFile: async (fromFilePath: string, toFilePath: string, newFileName: string) =>
		ipcRenderer.invoke("copy-file", fromFilePath, toFilePath, newFileName),
	clearTempDir: async () => ipcRenderer.invoke("clear-temp-dir"),
	copyEmptyResource: async (resourceType: "model" | "image") =>
		ipcRenderer.invoke("copy-empty-resource", resourceType),

	//自定义文件操作
	showOpenDialog: async (options: OpenDialogOptions): Promise<OpenDialogReturnValue> =>
		ipcRenderer.invoke("open-load-dialog", options),
	showSaveDialog: async (options: SaveDialogOptions): Promise<SaveDialogReturnValue> =>
		ipcRenderer.invoke("open-save-dialog", options),

	getVersion: () => version,
	getImageBase64: async (filePath: string): Promise<string> => ipcRenderer.invoke("get-image-base64", filePath),

	// 【新增】告诉主进程：我加载完了，有东西就发给我
  rendererReady: () => ipcRenderer.send("renderer-ready"),

  // 【新增】监听打开文件的请求 (涵盖冷启动和热启动)
  onOpenMapFile: (callback: (filePath: string) => void) => {
    const listener = (_event: any, filePath: string) => callback(filePath);
    ipcRenderer.on("open-map-file", listener);
    // 返回清理函数
    return () => ipcRenderer.removeListener("open-map-file", listener);
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

// Setup MCP tool listener in preload
ipcRenderer.on("mcp-invoke-tool", async (event, { toolName, args }) => {
	try {
		// Call the globally registered handler
		const handler = (globalThis as any).mcpToolHandler;
		if (!handler) {
			event.sender?.send("mcp-tool-response", {
				success: false,
				error: "MCP tool handler not initialized",
			});
			return;
		}

		const result = await handler(toolName, args);
		event.sender?.send("mcp-tool-response", {
			success: true,
			data: result,
		});
	} catch (error: any) {
		event.sender?.send("mcp-tool-response", {
			success: false,
			error: error.message || "Unknown error",
		});
	}
});

contextBridge.exposeInMainWorld("mcpAPI", {
	// MCP Server control
	startMCPServer: () => ipcRenderer.invoke("start-mcp-server"),
	stopMCPServer: () => ipcRenderer.invoke("stop-mcp-server"),
	getMCPStatus: () => ipcRenderer.invoke("get-mcp-status"),
	getMCPTools: () => ipcRenderer.invoke("get-mcp-tools"),

	// Listen for server status changes
	onServerStatusChange: (callback: (status: { running: boolean; url?: string }) => void) => {
		const listener = (_event: any, status: any) => callback(status);
		ipcRenderer.on("mcp-server-status", listener);
		return () => ipcRenderer.removeListener("mcp-server-status", listener);
	},

	// Listen for server errors
	onServerError: (callback: (error: { error: string }) => void) => {
		const listener = (_event: any, error: any) => callback(error);
		ipcRenderer.on("mcp-server-error", listener);
		return () => ipcRenderer.removeListener("mcp-server-error", listener);
	},

	// Register tool handler (called from renderer process)
	registerToolHandler: (handler: (toolName: string, args: any) => Promise<any>) => {
		console.log("[MCP Preload] Registering tool handler");
		// Store in preload's global scope
		(globalThis as any).mcpToolHandler = handler;
	},
});
