import {
	Buff,
	GameContext,
	GamePhaseInfo,
	IChanceCard,
	IGamePhase,
	IPlayer,
	IProperty,
	PlayerBuffTriggerTimingMap,
	PlayerEvents,
	PlayerEventsCallback,
	PlayerInfo,
	Role,
	UserInRoomInfo,
} from "@fatpaper-monopoly/types";
import { GamePhase } from "./GamePhase";
import { compileTsToJs, randomString } from "@src/utils";
import GameProcessTypes from "../editor-lib.d.ts?raw";

type CallbackMapValue<E extends PlayerEvents> = {
	id: string;
	fn: PlayerEventsCallback[E]; // 根据 PlayerEvents 类型映射到具体的回调函数类型
	triggerTimes: number;
	buff?: Buff;
};

export class Player implements IPlayer {
	public extras: Record<string, any> = {};
	public roundPhases: IGamePhase<GameContext>[] = [];

	private user: UserInRoomInfo;
	private money: number;
	private properties: IProperty[] = [];
	private chanceCards: IChanceCard[] = [];
	private buff: Buff[] = [];
	private positionIndex: number; //所在棋盘格子的下标
	private isStop: number; //是否停止回合
	private isBankrupted: boolean = false; //是否破产
	private isOffline: boolean; //是否断线
	private stop: number = 0;

	private callBackMap: Map<PlayerEvents, CallbackMapValue<PlayerEvents>[]> = new Map();

	constructor(
		user: UserInRoomInfo,
		initMoney: number,
		initPositionIndex: number,
		roundPhasesInfo: GamePhaseInfo[],
		role: Role
	) {
		this.roundPhases = roundPhasesInfo.map((roundPhaseInfo) => {
			return new GamePhase(roundPhaseInfo);
		});
		this.user = user;
		this.money = initMoney;
		this.positionIndex = initPositionIndex;
		this.isStop = 0;
		this.isOffline = false;

		const codeCompiled = compileTsToJs(role.initCode, GameProcessTypes);
		const roleInitFunction = new Function("player", codeCompiled)();
		roleInitFunction(this);
	}

	//玩家信息相关
	public getUser() {
		return this.user;
	}

	public getId() {
		return this.user.userId;
	}

	public getName() {
		return this.user.username;
	}

	public getIsOffline() {
		return this.isOffline;
	}

	public setIsOffline(isOffline: boolean) {
		this.isOffline = isOffline;
	}

	//地产相关
	public getPropertiesList() {
		return this.properties;
	}
	public setPropertiesList(newPropertiesList: IProperty[]) {
		this.properties = newPropertiesList;
	}

	public gainProperty(property: IProperty) {
		const owner = property.getOwner();
		if (owner && owner.getId() === this.getId()) this.properties.push(property);
	}

	public loseProperty(lostProperty: IProperty) {
		const index = this.properties.findIndex((property) => property.getId() === lostProperty.getId());
		if (index != -1) {
			this.properties.splice(index, 1);
		}
	}

	//机会卡相关
	public getCardsList() {
		return this.chanceCards;
	}

	public async setCardsList(newChanceCardList: IChanceCard[]) {
		this.chanceCards = newChanceCardList;
	}

	public async gainCard(gainCard: IChanceCard) {
		if (this.chanceCards.length >= 4) return;
		this.chanceCards.push(gainCard);
	}

	public async loseCard(cardId: string) {
		let card = this.chanceCards.find((card) => card.getId() === cardId);
		if (!card) return;
		const index = this.chanceCards.findIndex((_card) => _card.getId() === card.getId());
		if (index != -1) {
			this.chanceCards.splice(index, 1);
		}
	}

	//钱相关
	public getMoney() {
		return this.money;
	}

	public async setMoney(money: number) {
		this.money = money;
		if (this.money <= 0) this.setBankrupted(true);
	}

	public cost(money: number, target?: IPlayer) {
		this.money -= money > 0 ? money : 0;
		if (this.money <= 0) this.setBankrupted(true);
		return this.money > 0;
	}

	public gain(money: number, source?: IPlayer) {
		this.money += money;
		return this.money;
	}

	//游戏相关
	public async setStop(stop: number) {
		this.isStop = stop;
	}

	public getStop() {
		return this.isStop;
	}

	public setPositionIndex(newPositionIndex: number) {
		this.positionIndex = newPositionIndex;
	}

	public getPositionIndex() {
		return this.positionIndex;
	}

	public async walk(step: number): Promise<void> {
		this.emit(PlayerEvents.Walk, step);
		return new Promise((resolve) => {
			this.addEventListener(
				PlayerEvents.AnimationFinished,
				async () => {
					await this.emit(PlayerEvents.AfterWalk, step);
					resolve();
				},
				1
			);
		});
	}

	public async tp(positionIndex: number): Promise<void> {
		this.emit(PlayerEvents.Tp, positionIndex);
		return new Promise((resolve) => {
			this.addEventListener(PlayerEvents.AnimationFinished, async () => {
				await this.emit(PlayerEvents.AfterTp, positionIndex);
				resolve();
			});
		});
	}

	public async setBankrupted(isBankrupted: boolean) {
		this.isBankrupted = isBankrupted;
	}

	public getIsBankrupted() {
		return this.isBankrupted;
	}

	public getPlayerInfo(): PlayerInfo {
		const userInfo = this.user;
		const playerInfo: PlayerInfo = {
			id: this.user.userId,
			user: userInfo,
			money: this.money,
			properties: this.properties.map((property) => property.getPropertyInfo()),
			chanceCards: this.chanceCards.map((card) => card.getChanceCardInfo()),
			buff: this.getBuff(),
			positionIndex: this.positionIndex,
			stop: this.isStop,
			isBankrupted: this.isBankrupted,
			isOffline: this.isOffline,
		};
		return playerInfo;
	}

	public getBuff() {
		return [];
	}

	public getCardById(id: string) {
		const index = this.chanceCards.findIndex((card) => card.getId() === id);
		return this.chanceCards[index] || undefined;
	}

	public getRoundPhases() {
		return this.roundPhases;
	}

	public updateBuff(buffId: string, newBuff: Buff) {}

	public addEventListener<K extends PlayerEvents>(
		eventName: K,
		fn: PlayerEventsCallback[K],
		triggerTimes: number = Infinity,
		buff?: {
			id?: string;
			name: string;
			describe: string;
			source: string;
		}
	) {
		if (!this.callBackMap.has(eventName)) {
			this.callBackMap.set(eventName, []);
		}
		const fnArr = this.callBackMap.get(eventName);
		fnArr &&
			fnArr.unshift({
				id: randomString(16),
				fn,
				triggerTimes,
				buff: buff
					? {
							id: buff.id || randomString(16),
							...buff,
							type: eventName,
							triggerTimes,
							triggerTiming: PlayerBuffTriggerTimingMap[eventName],
					  }
					: undefined,
			});
	}

	public removeListener(eventName: PlayerEvents, id: string) {
		const fnArr = this.callBackMap.get(eventName);
		if (fnArr) {
			const removeIndex = fnArr.findIndex((fobj) => fobj.id === id);
			fnArr.splice(removeIndex, 1);
		}
	}

	public removeAllListeners(eventName?: PlayerEvents) {
		if (eventName) {
			if (this.callBackMap.has(eventName)) this.callBackMap.delete(eventName);
		} else {
			this.callBackMap.clear();
		}
	}

	public async emit<K extends keyof PlayerEventsCallback>(
		eventName: K,
		...args: Parameters<PlayerEventsCallback[K]>
	): Promise<ReturnType<PlayerEventsCallback[K]>> {
		const fnArr = this.callBackMap.get(eventName);
		let res: ReturnType<PlayerEventsCallback[K]> = undefined as unknown as ReturnType<PlayerEventsCallback[K]>;
		if (fnArr) {
			for (let index = 0; index < fnArr.length; index++) {
				const item = fnArr[index];

				item.triggerTimes--;
				if (item.triggerTimes >= 0) {
					const params = res !== undefined ? [res, ...args] : args;
					console.log("🚀 ~ Player ~ params:", params);
					res = await (
						item.fn as (...args: Parameters<PlayerEventsCallback[K]>) => ReturnType<PlayerEventsCallback[K]>
					)(...(params as Parameters<PlayerEventsCallback[K]>)); // 强制类型转换
					if (item.triggerTimes === 0) {
						fnArr.splice(index, 1);
						index--; // 防止跳过下一个元素
					}
				} else {
					fnArr.splice(index, 1);
					index--; // 防止跳过下一个元素
				}
				if (item.buff) {
					item.buff.triggerTimes = item.triggerTimes;
				}
			}
		}
		return res;
	}
}
