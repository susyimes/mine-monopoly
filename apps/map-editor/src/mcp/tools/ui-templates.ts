/**
 * MCP Tools for UI Template Management
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const GetUITemplatesSchema = z.object({});

export const AddUITemplateSchema = z.object({
	id: z.string().min(1, "Template ID is required"),
	slug: z.string().min(1, "Template slug is required"),
	name: z.string().min(1, "Template name is required"),
	template: z.object({
		id: z.string(),
		type: z.enum(["div", "span", "img", "button", "text", "svg", "path", "circle", "rect", "line", "g"]),
		style: z.record(z.any()).optional(),
		class: z.string().optional(),
		text: z.string().optional(),
		textBinding: z.string().optional(),
		src: z.string().optional(),
		srcBinding: z.string().optional(),
		children: z.array(z.any()).optional(),
		vFor: z.string().optional(),
		vShow: z.string().optional(),
		click: z.string().optional(),
		attrs: z.record(z.any()).optional(),
	}),
});

export const RemoveUITemplateSchema = z.object({
	templateId: z.string().min(1, "Template ID is required"),
});

export const UpdateUITemplateSchema = z.object({
	templateId: z.string().min(1, "Template ID is required"),
	slug: z.string().min(1, "Template slug is required").optional(),
	name: z.string().min(1, "Template name is required").optional(),
	template: z.object({
		id: z.string(),
		type: z.enum(["div", "span", "img", "button", "text", "svg", "path", "circle", "rect", "line", "g"]),
		style: z.record(z.any()).optional(),
		class: z.string().optional(),
		text: z.string().optional(),
		textBinding: z.string().optional(),
		src: z.string().optional(),
		srcBinding: z.string().optional(),
		children: z.array(z.any()).optional(),
		vFor: z.string().optional(),
		vShow: z.string().optional(),
		click: z.string().optional(),
		attrs: z.record(z.any()).optional(),
	}).optional(),
});

/**
 * Get all UI templates
 */
export async function getUITemplates(args: unknown) {
	try {
		const validated = GetUITemplatesSchema.parse(args);
		const result = await invokeTool("get_ui_templates", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get UI templates");
	}
}

/**
 * Add a new UI template
 */
export async function addUITemplate(args: unknown) {
	try {
		const validated = AddUITemplateSchema.parse(args);
		const result = await invokeTool("add_ui_template", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to add UI template");
	}
}

/**
 * Remove a UI template
 */
export async function removeUITemplate(args: unknown) {
	try {
		const validated = RemoveUITemplateSchema.parse(args);
		const result = await invokeTool("remove_ui_template", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to remove UI template");
	}
}

/**
 * Update a UI template
 */
export async function updateUITemplate(args: unknown) {
	try {
		const validated = UpdateUITemplateSchema.parse(args);
		const result = await invokeTool("update_ui_template", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to update UI template");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const uiTemplateTools = [
	{
		name: "get_ui_templates",
		description: "获取当前地图中定义的所有 UI 模板。UI 模板是可重用的 UI Schema，可以在游戏代码中使用 $ui__slug 语法引用。",
		inputSchema: GetUITemplatesSchema,
		handler: getUITemplates,
	},
	{
		name: "add_ui_template",
		description: "添加新的 UI 模板。UI 模板使用 JSON 结构定义可重用的 UI Schema。可以在游戏代码（effectCode、initEventCode）中使用 $ui__slug 语法引用，该语法会在运行时被替换为实际的模板 JSON。支持的元素：div、span、img、button、text 和 SVG 元素（svg、path、circle、rect、line、g）。每个元素可以有 style（样式）、class（类名）、text/textBinding（文本/文本绑定）、src/srcBinding（资源/资源绑定）、children（嵌套元素数组）、vFor、vShow、click 事件处理器和 attrs（自定义属性）。需要 id、slug、name 和 template 对象。",
		inputSchema: AddUITemplateSchema,
		handler: addUITemplate,
	},
	{
		name: "remove_ui_template",
		description: "根据ID删除 UI 模板",
		inputSchema: RemoveUITemplateSchema,
		handler: removeUITemplate,
	},
	{
		name: "update_ui_template",
		description: "更新现有 UI 模板。只提供需要更新的字段。",
		inputSchema: UpdateUITemplateSchema,
		handler: updateUITemplate,
	},
];
