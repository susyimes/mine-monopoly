import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import externalGlobals from "rollup-plugin-external-globals";
import { manifestGenerator } from "./build/plugins/vite-plugin-manifest";
import electron from "vite-plugin-electron/simple";
import generateDTS from "./src/plugins/vite-plugin-generate-dts";
import pkg from "./package.json";

const APP_VERSION_SHORT = pkg.version.split(".").slice(0, 2).join(".");

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
	return {
		base: "./",
		define: {
			// 全局常量注入
			__APP_VERSION__: JSON.stringify(pkg.version),
			__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
			__COMPATIBLE_VERSION__: JSON.stringify(APP_VERSION_SHORT),
		},
		plugins: [
			vue(),
			generateDTS(),
			viteCompression(),
			electron({
				main: {
					entry: "electron/main.ts",
				},
				preload: {
					input: path.join(__dirname, "electron/preload.ts"),
				},
				renderer: process.env.NODE_ENV === "test" ? undefined : {},
			}),
		],
		build: {
			outDir: "dist/frontend",
		},
		resolve: {
			alias: [
				{
					find: "@src",
					replacement: path.resolve(path.dirname("./"), "src"),
				},
			],
		},
		server: {
			port: 80,
		},
		esbuild: {
			drop: command === "build" ? ["console", "debugger"] : [],
		},
	};
});
