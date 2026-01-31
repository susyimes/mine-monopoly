/**
 * Global type definitions for MineMonopoly Map Editor
 */

import { OpenDialogOptions, SaveDialogOptions, OpenDialogReturnValue, SaveDialogReturnValue } from "electron";

declare global {
	interface Window {
		electronAPI: {
			// Window controls
			minimize: () => void;
			isMaximized: () => Promise<boolean>;
			maximize: () => void;
			unmaximize: () => void;
			close: () => void;

			// File operations
			readFile: (filePath: string) => Promise<Buffer>;
			saveFile: (filePath: string, data: string) => Promise<string>;
			saveLocalFile: (filePath: string, data: string) => Promise<string>;
			copyFile: (fromFilePath: string, toFilePath: string, newFileName: string) => Promise<{ filePath: string; fileType: string }>;
			clearTempDir: () => Promise<void>;
			copyEmptyResource: (resourceType: "model" | "image") => Promise<{ filePath: string; fileType: string; url: string }>;

			// Custom file operations
			showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
			showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogReturnValue>;

			// Version and info
			getVersion: () => string;
			getImageBase64: (filePath: string) => Promise<string>;

			// Renderer ready
			rendererReady: () => void;
			onOpenMapFile: (callback: (filePath: string) => void) => () => void;
		};

		updateAPI: {
			checkForUpdate: () => Promise<void>;
			startDownload: () => Promise<void>;
			quitAndInstall: () => Promise<void>;
			onUpdateStatus: (callback: (data: any) => void) => () => void;
		};

		mcpAPI: {
			startMCPServer: () => Promise<{ success: boolean; message: string }>;
			stopMCPServer: () => Promise<{ success: boolean; message: string }>;
			getMCPStatus: () => Promise<{ running: boolean }>;
			getMCPTools: () => Promise<Array<{ name: string; description: string }>>;
			onServerStatusChange: (callback: (status: { running: boolean }) => void) => () => void;
		};
	}
}

export {};
