import { ICommandMap, ICommand, ICommandContext } from "./command";

export type ModifierTiming = "before" | "after";

export interface ModifierDescriptor<C extends ICommandMap, K extends keyof C = keyof C> {
	id: string;
	timing: ModifierTiming;
	commandType: K;
	remainingTriggers: number;
	priority?: number;
	// 可序列化的信息用于给玩家 UI 展示
	meta?: {
		name: string;
		timingName: string;
		description: string;
		source: string;
	};
}

export interface IModifier<C extends ICommandMap, K extends keyof C = keyof C> {
	descriptor: ModifierDescriptor<C, K>;
	fn(command: ICommand<C, K>, context: ICommandContext<C, K>): Promise<void> | void;
}

export interface IModifierManager<C extends ICommandMap, K extends keyof C = keyof C> {
	add(mod: IModifier<C, K>): void;

	removeById(id: string): boolean;

	clear(): void;

	getModifiersList(): IModifier<C, K>[];

	getFor(cmd: ICommand<C, K>, timing: ModifierTiming): IModifier<C, K>[];

	decayAfterExecution(appliedMods: IModifier<C, K>[]): void;
}
