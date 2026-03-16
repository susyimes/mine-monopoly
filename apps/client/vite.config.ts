import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import viteCompression from "vite-plugin-compression";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json";
import generateMonacoDTS from "./plugins/vite-plugin-generate-monaco-dts";
import { envPlugin } from "../../packages/env/src/vite-plugin-env.ts";

const APP_VERSION_SHORT = pkg.version.split(".").slice(0, 2).join(".");

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
	const isCheck = mode === 'check';

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
			generateMonacoDTS(),
			viteCompression(),
			envPlugin({
				exclude: ['MYSQL_PASSWORD', 'TC_KEY'],
				envPath: '../../.env',
			}),
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
			outDir: isCheck ? "dist/check" : "dist/frontend",
			minify: isCheck ? false : 'terser',
			sourcemap: isCheck ? 'inline' : false,
		},
		resolve: {
			alias: [
				{
					find: "@src",
					replacement: path.resolve(path.dirname("./"), "src"),
				},
				{
					find: "@mine-monopoly/env",
					replacement: path.resolve(__dirname, "../../packages/env/src/browser.ts"),
				},
			],
		},
		server: {
			port: 5173,
		},
		esbuild: {
			// 只在生产构建（非 check）时删除 console 和 debugger
			drop: (command === 'build' && !isCheck) ? ['console', 'debugger'] : [],
		},
	};
});
