import { ICommandMap, ICommandBus, IModifier, ICommand, ICommandContext, IModifierManager } from "@mine-monopoly/types";

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
		let resultOverride: any = undefined;
		let cancelled = false;
		let cancelResult: any = undefined;

		// 记录修饰器执行状态
		const executedModifierIds: string[] = [];
		const skippedModifierIds = new Set<string>();
		const customConsumptions = new Map<string, number>();

		const ctx: ICommandContext<C, K> = {
			cancel: (result) => {
				cancelled = true;
				cancelResult = result;
			},
			setResult: (res) => (resultOverride = res),
			skip: () => {
				// 标记当前修饰器为跳过衰减
				// 注意：需要在修饰器执行时设置当前修饰器 ID
				const currentModId = (ctx as any).__currentModifierId;
				if (currentModId) {
					skippedModifierIds.add(currentModId);
				}
			},
			consume: (count: number) => {
				const currentModId = (ctx as any).__currentModifierId;
				if (currentModId) {
					customConsumptions.set(currentModId, count);
				}
			}
		};

		const beforeModifiers = this.modifierManager.getFor(command, "before");
		const afterModifiers = this.modifierManager.getFor(command, "after");

		// ---------- BEFORE ----------
		for (const m of beforeModifiers) {
			// 设置当前修饰器 ID
			(ctx as any).__currentModifierId = m.descriptor.id;

			await m.fn(currentCmd, ctx);
			executedModifierIds.push(m.descriptor.id); // 执行成功才推入

			// 清除当前修饰器 ID
			delete (ctx as any).__currentModifierId;

			if (cancelled) {
				// 中断：只扣除已经执行过的（排除 skipped）
				const idsToDecay = executedModifierIds.filter(id => !skippedModifierIds.has(id));
				this.modifierManager.decayAfterExecution(idsToDecay, customConsumptions);
				// 使用 cancel() 提供的返回值
				return cancelResult;
			}
		}

		// ---------- HANDLER ----------
		const handler = this.handlers.get(command.type);
		if (!handler) throw new Error(`命令: ${String(command.type)}, 没有设置handler`);

		// 如果 resultOverride 在 Before 阶段被设置了，是否跳过 Handler？
		// 通常逻辑是：没 Cancel 就执行 Handler，Result 只是覆盖返回值
		let result = await handler(command.payload);

		if (resultOverride !== undefined) {
			// 如果 Before 阶段已经产生结果（例如：护盾直接结算了伤害），覆盖它
			result = resultOverride;
		}

		// 更新 Context result 供 After 阶段使用
		ctx.result = result;

		// ---------- AFTER ----------
		for (const m of afterModifiers) {
			// 设置当前修饰器 ID
			(ctx as any).__currentModifierId = m.descriptor.id;

			await m.fn(currentCmd, ctx);
			executedModifierIds.push(m.descriptor.id); // 执行成功才推入

			// 清除当前修饰器 ID
			delete (ctx as any).__currentModifierId;
		}

		// ---------- DECAY ----------
		// 统一结算所有真正执行过的修饰器（排除 skipped）
		const idsToDecay = executedModifierIds.filter(id => !skippedModifierIds.has(id));
		this.modifierManager.decayAfterExecution(idsToDecay, customConsumptions);

		// After 阶段也可能通过 setResult 修改最终返回值
		if (resultOverride !== undefined) result = resultOverride;

		return result;
	}
}
