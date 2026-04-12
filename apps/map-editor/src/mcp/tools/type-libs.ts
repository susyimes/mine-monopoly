/**
 * MCP Tools for Type Libraries
 *
 * Returns all additional type libraries available to the code editor:
 * - Extra libs (user-defined custom code)
 * - UI template types (generated type declarations from UI templates)
 */

import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";
import { z } from "zod";

export const GetAllTypeLibsSchema = z.object({});

/**
 * Get all additional type libraries available to the code editor
 */
export async function getAllTypeLibs(args: unknown) {
	try {
		const result = await invokeTool("get_all_type_libs", args);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get type libraries");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const typeLibsTools = [
	{
		name: "get_all_type_libs",
		description:
			"获取代码编辑器中所有可用的额外类型库。返回 extraLibs（用户自定义的辅助函数、类型和常量）和 uiTemplateTypes（UI模板生成的类型声明，如 $ui__template-slug: UISchema）。使用此工具了解编写 effectCode 时可用的额外类型信息。",
		inputSchema: GetAllTypeLibsSchema,
		handler: getAllTypeLibs,
	},
];
