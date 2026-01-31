/**
 * MCP Tools for Map Analysis and Validation
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const ValidateMapSchema = z.object({
	checkLevel: z.enum(["basic", "strict"], {
		errorMap: () => ({ message: "checkLevel must be either 'basic' or 'strict'" }),
	}),
});

export const FindDuplicatesSchema = z.object({});

export const AnalyzeMapLayoutSchema = z.object({});

/**
 * Validate map integrity
 */
export async function validateMap(args: unknown) {
	try {
		const validated = ValidateMapSchema.parse(args);
		const result = await invokeTool("validate_map", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to validate map");
	}
}

/**
 * Find duplicate coordinates in map items
 */
export async function findDuplicates(args: unknown) {
	try {
		const validated = FindDuplicatesSchema.parse(args);
		const result = await invokeTool("find_duplicates", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to find duplicates");
	}
}

/**
 * Analyze map layout
 */
export async function analyzeMapLayout(args: unknown) {
	try {
		const validated = AnalyzeMapLayoutSchema.parse(args);
		const result = await invokeTool("analyze_map_layout", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to analyze map layout");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const analysisTools = [
	{
		name: "validate_map",
		description:
			"验证地图的错误和警告。checkLevel 可以是 'basic'（快速检查）或 'strict'（彻底验证）",
		inputSchema: ValidateMapSchema,
		handler: validateMap,
	},
	{
		name: "find_duplicates",
		description:
			"查找所有具有重复坐标的地图元素（相同的 x 和 y 位置）。返回坐标列表及其重叠的元素ID",
		inputSchema: FindDuplicatesSchema,
		handler: findDuplicates,
	},
	{
		name: "analyze_map_layout",
		description:
			"分析地图布局并返回边界、边界内的空位以及元素簇",
		inputSchema: AnalyzeMapLayoutSchema,
		handler: analyzeMapLayout,
	},
];
