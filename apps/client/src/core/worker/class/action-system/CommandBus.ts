import {
	ICommandMap,
	ICommandBus,
	IModifier,
	ICommand,
	ICommandContext,
	IModifierManager,
} from "@fatpaper-monopoly/types";

export class CommandBus<C extends ICommandMap> implements ICommandBus<C> {
	private handlers = new Map<keyof C, (payload: any) => any>();
	private modifierManager: IModifierManager<C>;

	constructor(modManager: IModifierManager<C>) {
		this.modifierManager = modManager;
	}

	setHandler<K extends keyof C>(type: K, handler: (payload: C[K]["payload"]) => C[K]["result"]): void {
		this.handlers.set(type, handler);
	}

	async execute<K extends keyof C>(command: ICommand<C, K>): Promise<C[K]["result"]> {
		let currentCmd: ICommand<C, K> = command;

		let cancelled = false;
		let resultOverride: any = undefined;

		const ctx: ICommandContext<C, K> = {
			cancel: () => (cancelled = true),
			setResult: (res) => (resultOverride = res),
		};

		const beforeModifiers = this.modifierManager.getFor(command, "before");
		const afterModifiers = this.modifierManager.getFor(command, "after");

		const tempAppliedModifiersList = [];
		// ---------- BEFORE ----------
		for (const m of beforeModifiers) {
			await m.fn(currentCmd, ctx);
			tempAppliedModifiersList.push(m);

			if (cancelled) {
				//如果中断, 将之前执行过的修饰器进行剩余次数扣除
				this.modifierManager.decayAfterExecution(tempAppliedModifiersList);
				return { ok: false, cancelled: true };
			}
		}

		// ---------- HANDLER ----------
		const handler = this.handlers.get(command.type);
		if (!handler) throw new Error(`命令: ${String(command.type)}, 没有设置handler`);
		let result = await handler(command.payload);

		ctx.result = result;
		// ---------- AFTER ----------
		for (const m of afterModifiers) {
			await m.fn(currentCmd, ctx);
		}

		//对执行过的修饰器进行剩余次数扣除
		const applied = [...beforeModifiers, ...afterModifiers];
		this.modifierManager.decayAfterExecution(applied);

		if (resultOverride !== undefined) result = resultOverride;

		return result;
	}
}
