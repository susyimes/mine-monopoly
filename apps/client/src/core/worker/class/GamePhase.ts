import {
	GameContext,
	GameEvent,
	GameEventFunction,
	GamePhaseInfo,
	GamePhaseMark,
	IGamePhase,
	ModifierTiming,
} from "@mine-monopoly/types";
import { compileTsToJs } from "@src/utils";
import GameProcessTypes from "../editor-lib.d.ts?raw";

export class GamePhase implements IGamePhase<GameContext> {
	public id: string;
	public name: string;
	public description: string;
	public mark?: GamePhaseMark | undefined;
	public from: string;
	public initEventCode: string;
	public eventKey: string | undefined;

	public eventQueue: GameEvent<GameContext>[] = [];

	constructor(gamePhaseInfo: GamePhaseInfo, eventKey?: string, extraLibs?: string) {
		this.id = gamePhaseInfo.id;
		this.name = gamePhaseInfo.name;
		this.description = gamePhaseInfo.description;
		this.mark = gamePhaseInfo.mark;
		this.from = gamePhaseInfo.from;
		this.initEventCode = gamePhaseInfo.initEventCode;
		this.eventKey = eventKey;
		const fullTypes = extraLibs ? `${GameProcessTypes}\n${extraLibs}` : GameProcessTypes;
		try {
			const gameEvent: GameEvent<GameContext> = {
				fn: evaluateGameEventFunction(this.initEventCode, fullTypes),
				key: eventKey,
			};
			this.eventQueue.push(gameEvent);
		} catch (e: any) {
			const error = new Error(`游戏阶段代码编译失败 (${this.name}): ${e.message}`);
			error.stack = e.stack;
			throw error;
		}
	}

	use(tiggerTime: ModifierTiming, gameEventFn: GameEventFunction<GameContext>, key?: string): void {
		if (tiggerTime === "after") {
			this.eventQueue.push({ fn: gameEventFn, key });
		} else {
			this.eventQueue.unshift({ fn: gameEventFn, key });
		}
	}

	getEventQueue(): GameEvent<GameContext>[] {
		return this.eventQueue.concat().map((gameEvent) => {
			gameEvent.key = this.mark + "";
			return gameEvent;
		});
	}
}

function evaluateGameEventFunction(sourceCode: string, fullTypes: string): GameEventFunction<GameContext> {
	if (!sourceCode.trim()) return async () => {};
	const directResult = tryEvaluateCompiledFunction(sourceCode, fullTypes);
	if (directResult) return directResult;

	const expression = sourceCode.trim().replace(/;\s*$/, "");
	const returnedResult = tryEvaluateCompiledFunction(`return ${expression};`, fullTypes);
	if (returnedResult) return returnedResult;

	const expressionResult = tryEvaluateCompiledFunction(`return (${expression});`, fullTypes);
	if (expressionResult) return expressionResult;

	console.warn("[GamePhase] 阶段代码没有返回可执行函数，已按空阶段处理", sourceCode.slice(0, 160));
	return async () => {};
}

function tryEvaluateCompiledFunction(sourceCode: string, fullTypes: string): GameEventFunction<GameContext> | undefined {
	try {
		const codeCompiled = compileTsToJs(sourceCode, fullTypes);
		const result = new Function(codeCompiled)();
		return typeof result === "function" ? result as GameEventFunction<GameContext> : undefined;
	} catch {
		return undefined;
	}
}
