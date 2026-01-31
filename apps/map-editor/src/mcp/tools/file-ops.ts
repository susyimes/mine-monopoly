/**
 * MCP Tools for File Operations
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const CreateNewMapSchema = z.object({});

export const LoadMapFileSchema = z.object({
	filePath: z.string().min(1, "File path is required"),
});

export const SaveMapFileSchema = z.object({
	filePath: z.string().optional(),
});

export const GetCurrentFilePathSchema = z.object({});

/**
 * Create a new blank map
 */
export async function createNewMap(args: unknown) {
	try {
		const validated = CreateNewMapSchema.parse(args);
		const result = await invokeTool("create_new_map", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to create new map");
	}
}

/**
 * Load a .fpmap file
 */
export async function loadMapFile(args: unknown) {
	try {
		const validated = LoadMapFileSchema.parse(args);
		const result = await invokeTool("load_map_file", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to load map file");
	}
}

/**
 * Save the current map to a file
 */
export async function saveMapFile(args: unknown) {
	try {
		const validated = SaveMapFileSchema.parse(args);
		const result = await invokeTool("save_map_file", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to save map file");
	}
}

/**
 * Get the current file path
 */
export async function getCurrentFilePath(args: unknown) {
	try {
		const validated = GetCurrentFilePathSchema.parse(args);
		const result = await invokeTool("get_current_file_path", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get current file path");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const fileOpsTools = [
	{
		name: "create_new_map",
		description: "创建新的空白地图，替换当前地图数据",
		inputSchema: CreateNewMapSchema,
		handler: createNewMap,
	},
	{
		name: "load_map_file",
		description: "从指定文件路径加载 .fpmap 地图文件",
		inputSchema: LoadMapFileSchema,
		handler: loadMapFile,
	},
	{
		name: "save_map_file",
		description:
			"将当前地图保存到文件。如果未提供 filePath，则使用当前文件路径或提示选择保存位置",
		inputSchema: SaveMapFileSchema,
		handler: saveMapFile,
	},
	{
		name: "get_current_file_path",
		description: "获取当前加载的地图文件路径",
		inputSchema: GetCurrentFilePathSchema,
		handler: getCurrentFilePath,
	},
];
