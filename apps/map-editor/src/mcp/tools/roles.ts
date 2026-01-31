/**
 * MCP Tools for Role Management
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const GetRolesSchema = z.object({});

export const AddRoleSchema = z.object({
	name: z.string().min(1, "Role name is required"),
	imageId: z.string().optional(), // 改为可选，如未提供将自动创建临时图片
	description: z.string().optional(),
	color: z.string().optional(),
	initCode: z.string().optional(),
});

export const UpdateRoleSchema = z.object({
	roleId: z.string().min(1, "Role ID is required"),
	name: z.string().optional(),
	description: z.string().optional(),
	color: z.string().optional(),
	initCode: z.string().optional(),
});

export const RemoveRoleSchema = z.object({
	roleId: z.string().min(1, "Role ID is required"),
});

/**
 * Get all roles
 */
export async function getRoles(args: unknown) {
	try {
		const validated = GetRolesSchema.parse(args);
		const result = await invokeTool("get_roles", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get roles");
	}
}

/**
 * Add a new role
 * 如果没有提供 imageId，将自动创建临时图片资源
 */
export async function addRole(args: unknown) {
	try {
		let validated = AddRoleSchema.parse(args);

		// 如果没有提供 imageId，自动创建临时图片
		if (!validated.imageId) {
			const tempImageResult = await invokeTool("add_temp_image", {});
			validated.imageId = tempImageResult.id;
		}

		const result = await invokeTool("add_role", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to add role");
	}
}

/**
 * Update an existing role
 */
export async function updateRole(args: unknown) {
	try {
		const validated = UpdateRoleSchema.parse(args);
		const result = await invokeTool("update_role", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to update role");
	}
}

/**
 * Remove a role
 */
export async function removeRole(args: unknown) {
	try {
		const validated = RemoveRoleSchema.parse(args);
		const result = await invokeTool("remove_role", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to remove role");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const roleTools = [
	{
		name: "get_roles",
		description: "获取地图中所有可用的角色",
		inputSchema: GetRolesSchema,
		handler: getRoles,
	},
	{
		name: "add_role",
		description: "添加新的玩家角色。需要 name（名称）。可选参数：imageId（图片ID）、description（描述）、color（代表颜色）、initCode（角色初始化代码）。注意：如果不提供 imageId，系统将自动创建临时图片资源（使用占位模板）。用户后续可以在编辑器中替换为想要的图片。",
		inputSchema: AddRoleSchema,
		handler: addRole,
	},
	{
		name: "update_role",
		description: "更新现有角色的信息。需要 roleId。可选参数：name、description、color、initCode",
		inputSchema: UpdateRoleSchema,
		handler: updateRole,
	},
	{
		name: "remove_role",
		description: "根据ID删除角色",
		inputSchema: RemoveRoleSchema,
		handler: removeRole,
	},
];
