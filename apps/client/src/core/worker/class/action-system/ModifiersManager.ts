import { ICommand, ICommandMap, IModifier, IModifierManager, ModifierTiming } from "@fatpaper-monopoly/types";

export class ModifierManager<C extends ICommandMap, K extends keyof C = keyof C> implements IModifierManager<C> {
	private modifiers: IModifier<C, K>[] = [];

	add(mod: IModifier<C, K>) {
		this.modifiers.push(mod);
		// 保持稳定排序（优先级从大到小）
		this.modifiers.sort((a, b) => (b.descriptor.priority || 0) - (a.descriptor.priority || 0));
		return mod.descriptor.id;
	}

	removeById(id: string) {
		const idx = this.modifiers.findIndex((m) => m.descriptor.id === id);
		if (idx !== -1) {
			this.modifiers.splice(idx, 1);
			return true;
		}
		return false;
	}

	//优先级高的修饰器在前
	getFor(cmd: ICommand<C, K>, timing: ModifierTiming) {
		return this.modifiers
			.filter((m) => {
				if (m.descriptor.timing !== timing) return false;
				if (cmd.type !== m.descriptor.commandType) return false;
				return true;
			})
			.sort((a, b) => {
				return (b.descriptor.priority || 0) - (a.descriptor.priority || 0);
			});
	}

	clear(): void {
		this.modifiers.length = 0;
	}

	getModifiersList(): IModifier<C, K>[] {
		return this.modifiers;
	}

	decayAfterExecution(appliedMods: IModifier<C, K>[]) {
		for (const m of appliedMods) {
			if (m.descriptor.remainingTriggers !== undefined) {
				m.descriptor.remainingTriggers--;
				if (m.descriptor.remainingTriggers <= 0) {
					this.removeById(m.descriptor.id);
				}
			}
		}
	}
}
