/**
 * MCP Tools for Map Items
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const GetMapItemsSchema = z.object({
	typeId: z.string().optional(),
	x: z.number().int().optional(),
	y: z.number().int().optional(),
	radius: z.number().nonnegative().optional(),
});

export const AddMapItemSchema = z.object({
	typeId: z.string().min(1, "Type ID is required"),
	x: z.number().int().min(-5000).max(5000),
	y: z.number().int().min(-5000).max(5000),
	rotation: z.number().int().min(0).max(3).optional(),
	mapEventId: z.string().optional(),
});

export const RemoveMapItemSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
});

export const UpdateMapItemSchema = z
	.object({
		itemId: z.string().min(1, "Item ID is required"),
		x: z.number().int().min(-5000).max(5000).optional(),
		y: z.number().int().min(-5000).max(5000).optional(),
		rotation: z.number().int().min(0).max(3).optional(),
	})
	.refine((data) => data.x !== undefined || data.y !== undefined || data.rotation !== undefined, {
		message: "At least one of x, y, or rotation must be provided",
	});

export const LinkMapItemsSchema = z.object({
	sourceId: z.string().min(1, "Source ID is required"),
	targetId: z.string().min(1, "Target ID is required"),
});

export const UnlinkMapItemSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
});

export const GetMapIndexSchema = z.object({});

export const SetMapIndexSchema = z.object({
	index: z.array(z.string()).min(1, "Index must not be empty"),
});

/**
 * Get map items with optional filtering
 */
export async function getMapItems(args: unknown) {
	try {
		const validated = GetMapItemsSchema.parse(args);
		const result = await invokeTool("get_map_items", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get map items");
	}
}

/**
 * Add a new map item
 */
export async function addMapItem(args: unknown) {
	try {
		const validated = AddMapItemSchema.parse(args);
		const result = await invokeTool("add_map_item", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to add map item");
	}
}

/**
 * Remove a map item
 */
export async function removeMapItem(args: unknown) {
	try {
		const validated = RemoveMapItemSchema.parse(args);
		const result = await invokeTool("remove_map_item", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to remove map item");
	}
}

/**
 * Update an existing map item
 */
export async function updateMapItem(args: unknown) {
	try {
		const validated = UpdateMapItemSchema.parse(args);
		const result = await invokeTool("update_map_item", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to update map item");
	}
}

/**
 * Link two map items together
 */
export async function linkMapItems(args: unknown) {
	try {
		const validated = LinkMapItemsSchema.parse(args);
		const result = await invokeTool("link_map_items", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to link map items");
	}
}

/**
 * Unlink a map item
 */
export async function unlinkMapItem(args: unknown) {
	try {
		const validated = UnlinkMapItemSchema.parse(args);
		const result = await invokeTool("unlink_map_item", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to unlink map item");
	}
}

/**
 * Get the current map index path
 */
export async function getMapIndex(args: unknown) {
	try {
		const validated = GetMapIndexSchema.parse(args);
		const result = await invokeTool("get_map_index", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get map index");
	}
}

/**
 * Set the map index path
 */
export async function setMapIndex(args: unknown) {
	try {
		const validated = SetMapIndexSchema.parse(args);
		const result = await invokeTool("set_map_index", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to set map index");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const mapItemTools = [
	{
		name: "get_map_items",
		description:
			"获取所有地图元素，支持按类型ID、坐标或半径过滤。如果提供 typeId 则按类型过滤；如果提供 x 和 y 则按精确坐标过滤；如果同时提供 x、y 和 radius 则按距离过滤。",
		inputSchema: GetMapItemsSchema,
		handler: getMapItems,
	},
	{
		name: "add_map_item",
		description:
			"在指定坐标添加新的地图元素。需要 typeId（类型ID）、x（X坐标）和 y（Y坐标）。可选接受 rotation（旋转，0-3）和 mapEventId（地图事件ID）。",
		inputSchema: AddMapItemSchema,
		handler: addMapItem,
	},
	{
		name: "remove_map_item",
		description: "根据ID删除地图元素。这将同时解除所有已连接的元素关联。",
		inputSchema: RemoveMapItemSchema,
		handler: removeMapItem,
	},
	{
		name: "update_map_item",
		description:
			"更新现有地图元素的位置或旋转。需要 itemId（元素ID），至少提供以下之一：x、y 或 rotation。",
		inputSchema: UpdateMapItemSchema,
		handler: updateMapItem,
	},
	{
		name: "link_map_items",
		description:
			"链接两个地图元素。源元素将链接到目标元素。用于地产扩展功能。",
		inputSchema: LinkMapItemsSchema,
		handler: linkMapItems,
	},
	{
		name: "unlink_map_item",
		description:
			"解除地图元素的所有连接。这将移除 linkto 和 beLinked 两种关联关系。",
		inputSchema: UnlinkMapItemSchema,
		handler: unlinkMapItem,
	},
	{
		name: "get_map_index",
		description: "获取当前地图索引路径（表示游戏路径的元素ID有序列表）",
		inputSchema: GetMapIndexSchema,
		handler: getMapIndex,
	},
	{
		name: "set_map_index",
		description:
			"设置地图索引路径。需要按顺序排列的元素ID数组。这定义了玩家在地图上移动的路径。",
		inputSchema: SetMapIndexSchema,
		handler: setMapIndex,
	},
];
