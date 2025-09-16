import { OperateListener } from "./class/OperateListener";
import { WorkerCommMsg } from "@src/interfaces/worker";
import { WorkerCommType } from "@src/enums/worker";

import Utils from "./class/Utils?raw";
import {
	ChanceCardClientInfo,
	ChanceCardInfo,
	ChanceCardInstanceInfo,
	GameContext,
	GameEvent,
	GameMap,
	IGamePhase,
	IGameProcess,
	MapEvent,
	MapItem,
	OperateType,
	PlayerOperationResult,
	PlayerRoundContext,
	SocketMsgType,
	UserInRoomInfo,
} from "@fatpaper-monopoly/types";
import Dice from "./class/Dice";
import { RoundTimeTimer } from "./class/RoundTimeTimer";
import { Player } from "./class/Player";
import { Property } from "./class/Property";
import { GameSetting, ServerSocketMessage } from "@src/interfaces/bace";
import { ChanceCard } from "./class/ChanceCard";
import { compileTsToJs } from "@src/utils";
import { GamePhase } from "@src/core/worker/class/GamePhase";
import { GameRuntimeStack } from "@src/core/worker/class/GameRuntimeStack";

const operationListener = new OperateListener();
let gameProcess: GameProcess | null = null;

self.postMessage(<WorkerCommMsg>{
	type: WorkerCommType.WorkerReady,
});

self.addEventListener("message", (ev) => {
	const data = ev.data as WorkerCommMsg;
	switch (data.type) {
		case WorkerCommType.LoadGameInfo:
			{
				const { mapInfo, setting, userList, roomOwnerId } = data.data;
				gameProcess = new GameProcess(mapInfo, setting, userList, roomOwnerId);
				gameProcess.start();
			}
			break;
		case WorkerCommType.EmitOperation:
			{
				const { userId, operateType, data: _data } = data.data;
				operationListener.emit(userId, operateType, _data);
			}
			break;
		case WorkerCommType.UserOffLine:
			{
				// const { userId } = data.data;
				// gameProcess && gameProcess.handlePlayerOffline(userId);
			}
			break;
		case WorkerCommType.UserReconnect:
			{
				// const { userId } = data.data;
				// gameProcess && gameProcess.handlePlayerReconnect(userId);
			}
			break;
	}
});

function sendToUsers(userIdList: string[], msg: ServerSocketMessage) {
	self.postMessage(<WorkerCommMsg>{
		type: WorkerCommType.SendToUsers,
		data: {
			userIdList,
			data: msg,
		},
	});
}

(async () => {})();

export class GameProcess implements IGameProcess {
	public extraData: Record<string, any> = {};

	public mapData: GameMap;
	private gameSetting: GameSetting;
	private userList: UserInRoomInfo[];

	private gameRoundPhase: {
		roundStartPhase: IGamePhase<GameContext>[];
		roundEndPhase: IGamePhase<GameContext>[];
	};
	public currentGamePhase: IGamePhase<GameContext> | null = null;
	public players: Map<string, Player> = new Map();
	public properties: Map<string, Property> = new Map();
	public chanceCardInfos: Map<string, ChanceCardInfo> = new Map();
	public mapItems: Map<string, MapItem> = new Map();
	public mapEvents: Map<string, MapEvent> = new Map();

	public gameRuntimeStack: GameRuntimeStack = new GameRuntimeStack();

	public currentRoundPlayer: Player | null = null;
	public currentRound: number = 0; //当前回合
	private isGameOver: boolean = false;
	private timeoutList: any[] = []; //计时器列表
	private intervalTimerList: any[] = []; //计时器列表
	private roundTimeTimer: RoundTimeTimer; //倒计时

	private dice: Dice;

	constructor(mapData: GameMap, gameSetting: GameSetting, userList: UserInRoomInfo[], roomOwnerId: string) {
		this.mapData = mapData;
		this.gameSetting = gameSetting;
		this.userList = userList;
		console.log("🚀 ~ GameProcess ~ constructor ~ mapData:", mapData);

		this.dice = new Dice(gameSetting.diceNum);
		this.roundTimeTimer = new RoundTimeTimer(gameSetting.roundTime, 1000);
		if (gameSetting.slackOffMode) {
			operationListener.on(roomOwnerId, OperateType.PauseGame, () => {
				console.log("PauseGame");
				this.roundTimeTimer.pause();
				this.gameBroadcast(<ServerSocketMessage>{
					type: SocketMsgType.PauseGame,
					msg: {
						type: "info",
						content: "房主摸鱼被发现了，游戏暂停",
					},
				});
			});
			operationListener.on(roomOwnerId, OperateType.ResumeGame, () => {
				console.log("ResumeGame");
				this.roundTimeTimer.resume();
				this.gameBroadcast(<ServerSocketMessage>{
					type: SocketMsgType.ResumeGame,
					msg: {
						type: "info",
						content: "房主回来了，游戏继续",
					},
				});
			});
		}

		this.gameRoundPhase = {
			roundStartPhase: mapData.phases.gameRoundStart.map((phaseInfo) => new GamePhase(phaseInfo)),
			roundEndPhase: mapData.phases.gameRoundEnd.map((phaseInfo) => new GamePhase(phaseInfo)),
		};
		this.initMap();
		this.initPlayer();
	}

	private initMap() {
		const { mapItems, mapEvents, chanceCards } = this.mapData;

		mapEvents.forEach((mapEvent) => {
			this.mapEvents.set(mapEvent.id, { ...mapEvent, effectCode: compileTsToJs(mapEvent.effectCode, "") });
		});

		mapItems.forEach((mapItem) => {
			if (mapItem.property) {
				const property = mapItem.property;
				this.properties.set(property.id, new Property(property));
			}
			this.mapItems.set(mapItem.id, mapItem);
		});

		chanceCards.forEach((chanceCard) => {
			this.chanceCardInfos.set(chanceCard.id, {
				...chanceCard,
				effectCode: compileTsToJs(chanceCard.effectCode, ""),
			});
		});
	}

	private initPlayer() {
		this.userList.forEach((u) => {
			const player = new Player(u, this.gameSetting.initMoney, 0, this.mapData.phases.playerRound);
			this.players.set(player.getId(), player);
		});
	}

	private async gameLoop() {
		//游戏循环
		while (!this.isGameOver) {
			//回合循环 加载回合开始阶段
			const roundStartPhases = this.gameRoundPhase.roundStartPhase;
			for (const phase of roundStartPhases) {
				await this.runGamePhase(phase);
			}

			//玩家回合
			for (const player of Array.from(this.players.values())) {
				const context: PlayerRoundContext = {
					currentRoundPlayer: player,
				};
				const playerRoundPhases = player.getRoundPhases();
				for (const phase of playerRoundPhases) {
					await this.runGamePhase(phase, context);
				}
			}

			//回合结束阶段
			const roundEndPhases = this.gameRoundPhase.roundEndPhase;
			for (const phase of roundEndPhases) {
				await this.runGamePhase(phase);
			}
		}
	}

	public async onPlayerOperation<T extends OperateType>(
		playerId: string,
		operationType: T
	): Promise<PlayerOperationResult[T]> {
		return await operationListener.onAsync(playerId, operationType);
	}

	public async runGamePhase(phase: IGamePhase<GameContext>, context?: GameContext) {
		this.currentGamePhase = phase;
		this.gameRuntimeStack.push(...phase.getEventQueue().reverse());
		await this.gameRuntimeStack.run(context);
	}

	public pushEventToStack(...gameEvents: GameEvent<GameContext>[]) {
		this.gameRuntimeStack.push(...gameEvents);
	}

	public async start() {
		await this.gameLoop();
	}

	public gameBroadcast(msg: ServerSocketMessage) {
		sendToUsers(
			Array.from(this.players.values()).map((p) => p.getId()),
			msg
		);
	}
}
