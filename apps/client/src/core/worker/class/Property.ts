import {
	ICommandBus,
	IModifierManager,
	IPlayer,
	IProperty,
	PropertyCommandMap,
	PropertyInfo,
} from "@fatpaper-monopoly/types";
import { ModifierManager } from "./action-system/ModifiersManager";
import { CommandBus } from "./action-system/CommandBus";
import GameProcessTypes from "../editor-lib.d.ts?raw";
import { compileTsToJs } from "@src/utils";

export class Property implements IProperty {
	private id: string;
	private name: string;
	private buildCost: number;
	private level: number;
	private maxLevel: number;
	private sellCost: number;
	private costList: number[];
	private streetId: string;
	private owner: IPlayer | undefined = undefined;
	public modifierManager: IModifierManager<PropertyCommandMap>;
	public commandBus: ICommandBus<PropertyCommandMap>;
	private originalData: PropertyInfo;

	constructor(property: PropertyInfo) {
		this.id = property.id;
		this.name = property.name;
		this.level = 0;
		this.buildCost = property.buildCost;
		this.sellCost = property.sellCost;
		this.costList = property.costList;
		this.maxLevel = property.maxLevel;
		this.streetId = property.streetId;
		this.originalData = property;

		this.modifierManager = new ModifierManager();
		this.commandBus = new CommandBus<PropertyCommandMap>(this.modifierManager);

		this.initCommandBus();

		if (property.custom) {
			const codeCompiled = compileTsToJs(property.custom.effectCode, GameProcessTypes);
			const propertyInitFunction = new Function(codeCompiled)();
			propertyInitFunction(this);
		}
	}

	private initCommandBus() {
		this.commandBus.setHandler("property.owner.change", (payload) => {
			const { oldOwner, newOwner } = payload;
			//如果原本有主人
			if (oldOwner) {
				oldOwner.loseProperty(this);
			}
			this.owner = newOwner;
			if (newOwner) {
				newOwner.gainProperty(this);
			}
			return payload;
		});

		this.commandBus.setHandler("property.level.up", (payload) => {
			if (this.level < this.maxLevel) {
				this.level++;
			}
			return payload;
		});

		this.commandBus.setHandler("property.level.down", (payload) => {
			if (this.level > 0) {
				this.level--;
			}
			return payload;
		});

		this.commandBus.setHandler("property.level.set", (payload) => {
			const { oldLevel, newLevel } = payload;
			this.level = newLevel;
			return payload;
		});

		this.commandBus.setHandler("property.arrived", async (payload) => {
			const { owner, arrivedPlayer, toll } = payload;
			if (owner !== undefined && toll !== undefined) {
				await owner.gain(toll);
				await arrivedPlayer.cost(toll);
			}
			return payload;
		});
	}

	public getId = () => this.id;
	public getName = () => this.name;
	public getBuildingLevel = () => this.level;
	public getBuildCost = () => this.buildCost;
	public getSellCost = () => this.sellCost;
	public getCostList = () => this.costList;
	public getMaxLevel = () => this.maxLevel;
	public getOwner = () => this.owner;
	public getOriginalData = () => this.originalData;

	public async levelUp() {
		this.commandBus.execute({ type: "property.level.up", payload: {} });
	}

	public async levelDown() {
		this.commandBus.execute({ type: "property.level.down", payload: {} });
	}

	public async setLevel(level: number) {
		this.commandBus.execute({ type: "property.level.set", payload: { oldLevel: this.level, newLevel: level } });
	}

	public async setOwner(player: IPlayer | undefined) {
		this.commandBus.execute({ type: "property.owner.change", payload: { oldOwner: this.owner, newOwner: player } });
	}

	public async arrived(player: IPlayer) {
		this.commandBus.execute({
			type: "property.arrived",
			payload: { owner: this.owner, arrivedPlayer: player, toll: this.costList[this.level] || 0 },
		});
	}

	public getPropertyInfo(): PropertyInfo {
		const owner = this.owner;
		const propertyInfo: PropertyInfo = {
			id: this.id,
			name: this.name,
			level: this.level,
			maxLevel: this.maxLevel,
			buildCost: this.buildCost,
			sellCost: this.sellCost,
			costList: this.costList,
			streetId: this.streetId,
			owner: owner ? owner.getUser() : undefined,
		};
		return propertyInfo;
	}
}
