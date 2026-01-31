/**
 * MCP Tools for Game Setting Form Management
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const GetGameSettingFormSchema = z.object({});

const FormFieldSchema = z.object({
	id: z.string(),
	key: z.string(),
	type: z.enum([
		"number-input",
		"text-input",
		"select",
		"checkbox",
		"slider",
	]),
	label: z.string(),
	defaultValue: z.any(),
	options: z.array(z.object({
		label: z.string(),
		value: z.any(),
	})).optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	step: z.number().optional(),
});

export const UpdateGameSettingFormSchema = z.object({
	form: z.array(FormFieldSchema),
});

/**
 * Get game setting form
 */
export async function getGameSettingForm(args: unknown) {
	try {
		const validated = GetGameSettingFormSchema.parse(args);
		const result = await invokeTool("get_game_setting_form", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get game setting form");
	}
}

/**
 * Update game setting form
 */
export async function updateGameSettingForm(args: unknown) {
	try {
		const validated = UpdateGameSettingFormSchema.parse(args);
		const result = await invokeTool("update_game_setting_form", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to update game setting form");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const gameSettingTools = [
	{
		name: "get_game_setting_form",
		description: "获取游戏设置表单架构。游戏设置表单定义了游戏的可配置选项，如初始金钱、回合时间限制等。这些设置在开始游戏时显示。",
		inputSchema: GetGameSettingFormSchema,
		handler: getGameSettingForm,
	},
	{
		name: "update_game_setting_form",
		description: "更新游戏设置表单架构。表单是字段对象数组，每个字段定义一个可配置选项。支持的字段类型：number-input（数字输入）、text-input（文本输入）、select（选择）、checkbox（复选框）、slider（滑块）。每个字段需要：id（唯一标识符）、key（游戏代码中的变量名）、type（输入类型）、label（显示名称）、defaultValue（默认值）。可选字段：options（用于 select 类型）、min/max/step（用于 number/slider 类型）。表单将完全替换现有表单。",
		inputSchema: UpdateGameSettingFormSchema,
		handler: updateGameSettingForm,
	},
];
