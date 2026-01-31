/**
 * MCP Tools for Custom UI Management
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const GetCustomUIsSchema = z.object({});

export const AddCustomUISchema = z.object({
	id: z.string().min(1, "Custom UI ID is required"),
	name: z.string().min(1, "Custom UI name is required"),
	layout: z.object({
		x: z.number(),
		y: z.number(),
		width: z.number(),
		height: z.number(),
	}),
	uiSchema: z.string().min(1, "UI schema is required"),
});

export const RemoveCustomUISchema = z.object({
	customUIId: z.string().min(1, "Custom UI ID is required"),
});

export const UpdateCustomUISchema = z.object({
	customUIId: z.string().min(1, "Custom UI ID is required"),
	name: z.string().min(1, "Custom UI name is required").optional(),
	layout: z.object({
		x: z.number(),
		y: z.number(),
		width: z.number(),
		height: z.number(),
	}).optional(),
	uiSchema: z.string().min(1, "UI schema is required").optional(),
});

/**
 * Get all custom UIs
 */
export async function getCustomUIs(args: unknown) {
	try {
		const validated = GetCustomUIsSchema.parse(args);
		const result = await invokeTool("get_custom_uis", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get custom UIs");
	}
}

/**
 * Add a new custom UI
 */
export async function addCustomUI(args: unknown) {
	try {
		const validated = AddCustomUISchema.parse(args);
		const result = await invokeTool("add_custom_ui", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to add custom UI");
	}
}

/**
 * Remove a custom UI
 */
export async function removeCustomUI(args: unknown) {
	try {
		const validated = RemoveCustomUISchema.parse(args);
		const result = await invokeTool("remove_custom_ui", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to remove custom UI");
	}
}

/**
 * Update a custom UI
 */
export async function updateCustomUI(args: unknown) {
	try {
		const validated = UpdateCustomUISchema.parse(args);
		const result = await invokeTool("update_custom_ui", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to update custom UI");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const customUITools = [
	{
		name: "get_custom_uis",
		description: "获取当前地图中定义的所有自定义 UI 实例。自定义 UI 是放置在游戏地图特定位置的 UI 元素。",
		inputSchema: GetCustomUIsSchema,
		handler: getCustomUIs,
	},
	{
		name: "add_custom_ui",
		description: "添加新的自定义 UI 实例。自定义 UI 允许在游戏地图的特定位置放置 UI 元素。uiSchema 应该是表示 UI 结构的 JSON 字符串（与 UITemplate.template 格式相同）。layout 定义在屏幕上的位置（x, y）和大小（width, height）。需要 id、name、layout（x、y、width、height）和 uiSchema（JSON 字符串）。",
		inputSchema: AddCustomUISchema,
		handler: addCustomUI,
	},
	{
		name: "remove_custom_ui",
		description: "根据ID删除自定义 UI 实例",
		inputSchema: RemoveCustomUISchema,
		handler: removeCustomUI,
	},
	{
		name: "update_custom_ui",
		description: "更新现有自定义 UI 实例。只提供需要更新的字段。",
		inputSchema: UpdateCustomUISchema,
		handler: updateCustomUI,
	},
];
