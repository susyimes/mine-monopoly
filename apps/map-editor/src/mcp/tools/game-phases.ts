/**
 * MCP Tools for Game Phase Management
 */

import { z } from "zod";
import { invokeTool } from "../bridge.js";
import { successResult, errorResult } from "../utils.js";

/**
 * Zod schemas for input validation
 */
export const GetPhasesSchema = z.object({});

export const AddPhaseSchema = z.object({
	id: z.string().min(1, "Phase ID is required"),
	name: z.string().min(1, "Phase name is required"),
	description: z.string().min(1, "Description is required"),
	phaseType: z.enum([
		"gameOverRule",
		"gameInited",
		"gameRoundStart",
		"playerRound",
		"gameRoundEnd",
	], {
		errorMap: () => ({ message: "Invalid phase type. Must be one of: gameOverRule, gameInited, gameRoundStart, playerRound, gameRoundEnd" }),
	}),
	mark: z.enum([
		"GameRoundStart",
		"PlayerRoundStart",
		"RollDice",
		"PlayerMove",
		"ArrivedEvent",
		"PlayerRoundEnd",
		"GameRoundEnd",
	]).optional(),
	from: z.string().min(1, "From is required"),
	initEventCode: z.string().min(1, "Init event code is required"),
});

export const RemovePhaseSchema = z.object({
	phaseId: z.string().min(1, "Phase ID is required"),
	phaseType: z.enum([
		"gameOverRule",
		"gameInited",
		"gameRoundStart",
		"playerRound",
		"gameRoundEnd",
	], {
		errorMap: () => ({ message: "Invalid phase type. Must be one of: gameOverRule, gameInited, gameRoundStart, playerRound, gameRoundEnd" }),
	}),
});

export const UpdatePhaseSchema = z.object({
	phaseId: z.string().min(1, "Phase ID is required"),
	phaseType: z.enum([
		"gameOverRule",
		"gameInited",
		"gameRoundStart",
		"playerRound",
		"gameRoundEnd",
	], {
		errorMap: () => ({ message: "Invalid phase type. Must be one of: gameOverRule, gameInited, gameRoundStart, playerRound, gameRoundEnd" }),
	}),
	name: z.string().min(1, "Phase name is required").optional(),
	description: z.string().min(1, "Description is required").optional(),
	mark: z.enum([
		"GameRoundStart",
		"PlayerRoundStart",
		"RollDice",
		"PlayerMove",
		"ArrivedEvent",
		"PlayerRoundEnd",
		"GameRoundEnd",
	]).optional(),
	initEventCode: z.string().min(1, "Init event code is required").optional(),
});

/**
 * Get all game phases
 */
export async function getPhases(args: unknown) {
	try {
		const validated = GetPhasesSchema.parse(args);
		const result = await invokeTool("get_phases", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to get phases");
	}
}

/**
 * Add a new game phase
 */
export async function addPhase(args: unknown) {
	try {
		const validated = AddPhaseSchema.parse(args);
		const result = await invokeTool("add_phase", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to add phase");
	}
}

/**
 * Remove a game phase
 */
export async function removePhase(args: unknown) {
	try {
		const validated = RemovePhaseSchema.parse(args);
		const result = await invokeTool("remove_phase", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to remove phase");
	}
}

/**
 * Update a game phase
 */
export async function updatePhase(args: unknown) {
	try {
		const validated = UpdatePhaseSchema.parse(args);
		const result = await invokeTool("update_phase", validated);
		return successResult(result);
	} catch (error: any) {
		return errorResult(error.message || "Failed to update phase");
	}
}

/**
 * Export tool definitions for MCP server
 */
export const gamePhaseTools = [
	{
		name: "get_phases",
		description: "获取当前地图中定义的所有游戏阶段。游戏阶段控制游戏流程，如掷骰子、玩家移动和事件处理。",
		inputSchema: GetPhasesSchema,
		handler: getPhases,
	},
	{
		name: "add_phase",
		description:
			"添加新的游戏阶段。游戏阶段被组织到不同类别中：gameOverRule（游戏结束检查）、gameInited（一次性初始化）、gameRoundStart（每回合开始）、playerRound（玩家回合）、gameRoundEnd（每回合结束）。每个阶段都有一个 initEventCode 在阶段执行时运行。重要提示：initEventCode 必须返回一个接受 (ctx: GameContext, gameProcess: IGameProcess) 参数的异步函数。ctx 类型因阶段标记而异。常见的上下文类型包括：GameRoundStartContext、PlayerRoundContext（包含 currentRoundPlayer）。需要 id、name、description、phaseType（类别）、from 和 initEventCode。mark 可选。",
		inputSchema: AddPhaseSchema,
		handler: addPhase,
	},
	{
		name: "remove_phase",
		description: "根据ID删除游戏阶段。需要 phaseId 和 phaseType（阶段所属的类别：gameOverRule、gameInited、gameRoundStart、playerRound、gameRoundEnd）。",
		inputSchema: RemovePhaseSchema,
		handler: removePhase,
	},
	{
		name: "update_phase",
		description: "更新现有游戏阶段。需要 phaseId 和 phaseType。只提供需要更新的字段（name、description、mark、initEventCode）。",
		inputSchema: UpdatePhaseSchema,
		handler: updatePhase,
	},
];
