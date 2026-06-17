import { FPMessage } from "@mine-monopoly/ui";
import { useChat, useGameLog, useLoading, useRoomInfo, useUserInfo, useUtil } from "@src/store";
import { useGameData, useMapData } from "@src/store/game";
import { emitHostPeerId, joinRoomApi } from "@src/utils/api/room-router";
import { PeerClient } from "./PeerClient";
import { ReconnectionManager } from "./ReconnectionManager";
import { DataConnection } from "peerjs";
import {
	RoomMapInfo,
	GameSetting,
	OperateType,
	ServerSocketMessage,
	SocketMsgSource,
	SocketMsgType,
	User,
	ClientSocketMessage,
} from "@mine-monopoly/types";
import { MonopolyHost } from "../monopoly-host/MonopolyHost";
import { handleServerSocketMessage } from "./host-message-handlers";
import router from "@src/router";
import { debounce } from "@src/utils";
import { arrayBufferToBase64 } from "@mine-monopoly/utils";

type MonopolyClientOptions = {
	iceServer: {
		host: string;
		port: number;
	};
};

type AutomationMessageDirection = "in" | "out";

declare global {
	interface Window {
		__AI_LIVE_AUTOMATION__?: {
			user?: unknown;
			messages?: Array<Record<string, unknown>>;
		};
		__AI_LIVE_CLIENT_BRIDGE__?: Record<string, unknown>;
	}
}

export class MonopolyClient {
	private static instance: MonopolyClient | null;
	private options: MonopolyClientOptions;
	private iceServerHost: string;
	private iceServerPort: number;

	private gameHost: MonopolyHost | null = null;
	private peerClient: PeerClient | null = null;
	private conn: DataConnection | null = null;
	private isOnline = false;
	private currentIceServers: RTCIceServer[] = [];

	private sendHeartTime = 0;
	private intervalList: any[] = [];
	private handleNoHeartTimer: ReturnType<typeof debounce> | null = null;
	private heartbeatTimeoutMs = isAutomationMode() ? 60000 : 15000;
	private heartBeatPaused = false;
	private reconnectionManager: ReconnectionManager | null = null;
	private currentHostPeerId: string | null = null; // 保存当前主机 PeerId 用于重连

	public static getInstance(): MonopolyClient;
	public static getInstance(options: MonopolyClientOptions): Promise<MonopolyClient>;
	public static getInstance(options?: MonopolyClientOptions) {
		if (this.instance) {
			this.instance.installAutomationBridge();
			return this.instance;
		}
		if (options) {
			return (async () => {
				this.instance = new MonopolyClient(options);

				return this.instance;
			})();
		} else {
			// if (!this.instance) {
			// 	throw Error("在调用MonopolyClient之前应该先对其初始化, 使用useMonopolyClient时提供options以初始化");
			// }
			return this.instance;
		}
	}

	private constructor(options: MonopolyClientOptions) {
		const {
			iceServer: { host: iceHost, port: icePort },
		} = options;

		this.options = options;
		this.iceServerHost = iceHost;
		this.iceServerPort = icePort;
		this.installAutomationBridge();
	}

	public async joinRoom(roomId: string) {
		try {
			const res = await joinRoomApi(roomId);
			const data = res.data;
			const userStore = useUserInfo();
			let hostPeerId = data.hostPeerId;

			this.currentIceServers = data.iceServers;

			if (data.needCreate) {
				useLoading().showLoading("正在创建主机...");
				if (this.gameHost) throw Error("你已经是主机了,为什么要再次创建房间!!!");
				this.gameHost = await MonopolyHost.create(
					roomId,
					this.iceServerHost,
					this.iceServerPort,
					data.deleteIntervalMs,
					this.currentIceServers,
				);
				this.gameHost.addDestoryListener(() => {
					this.gameHost = null;
					this.peerClient = null;
				});
				hostPeerId = this.gameHost.getPeerId();
				useLoading().showLoading("主机创建成功，正在和服务器报喜...");
				await emitHostPeerId(roomId, hostPeerId, userStore.username, userStore.userId);
			}
			if (hostPeerId) {
				useLoading().showLoading("连接主机中...");
				await this.linkToGameHost(hostPeerId);
			}
		} catch (e: any) {
			FPMessage({ type: "error", message: e?.message || "服务器连接失败" });
		}
	}

	private async linkToGameHost(hostPeerId: string) {
		try {
			// 保存主机 PeerId 用于重连
			this.currentHostPeerId = hostPeerId;

			// 清理旧的连接和事件监听器
			if (this.conn) {
				this.conn.removeAllListeners();
				this.conn.close();
				this.conn = null;
			}

			// 停止旧的重连管理器
			if (this.reconnectionManager) {
				this.reconnectionManager.destroy();
				this.reconnectionManager = null;
			}

			// 清理所有定时器
			this.intervalList.forEach((timer) => clearInterval(timer));
			this.intervalList = [];
			this.handleNoHeartTimer?.cancel();
			this.handleNoHeartTimer = null;

			if (!this.peerClient) {
				this.peerClient = await PeerClient.create(this.iceServerHost, this.iceServerPort, this.currentIceServers);
			}
			const { conn } = await this.peerClient.linkToHost(hostPeerId);
			this.conn = conn;
			this.bindConnectionHandlers(conn);
			const { userId, username, color, avatar } = useUserInfo();
			const user: User = {
				userId,
				username,
				color,
				avatar,
				isReady: false,
			};
			this.sendMsg({ type: SocketMsgType.JoinRoom, source: SocketMsgSource.Client, data: user });

			FPMessage({
				type: "success",
				message: "主机连接成功🤗",
			});
			this.isOnline = true;

			// 初始化心跳超时定时器
			this.initHeartBeat();

			// 启动心跳发送定时器
			this.intervalList.push(
				setInterval(() => {
					if (this.heartBeatPaused) return;
					this.sendHeartTime = Date.now();
					this.sendMsg({ type: SocketMsgType.Heart, source: SocketMsgSource.Client, data: undefined });
				}, 3000),
			);
		} catch (e: any) {
			if (this.peerClient) {
				this.peerClient.destory();
				this.peerClient = null;
			}
			FPMessage({ type: "error", message: e?.message || e });
		}
	}

	private bindConnectionHandlers(conn: DataConnection) {
		conn.on("data", (_data: any) => {
			let data: ServerSocketMessage;
			try {
				data = JSON.parse(_data, (key, value) => {
					if (value === "Infinity") return Infinity;
					if (value === "-Infinity") return -Infinity;
					return value;
				});
			} catch {
				console.error("Failed to parse server message:", _data);
				return;
			}
			this.recordAutomationMessage("in", data);
			if (data.msg) {
				// 在显示通知消息时，隐藏任何正在显示的 loading
				useLoading().hideLoading();
				FPMessage({
					type: data.msg.type,
					message: data.msg.content,
				});
			}
			// console.log("Client Receive: ", data);

			handleServerSocketMessage(data, this);
		});

		conn.on("close", () => {
			if (this.isOnline) {
				this.isOnline = false;
				this.startReconnection();
			}
		});

		conn.on("error", (err) => {
			if (this.isOnline && err.type === "not-open-yet") {
				this.isOnline = false;
				this.startReconnection();
			}
		});
	}

	/**
	 * 启动自动重连
	 */
	private startReconnection() {
		if (this.reconnectionManager?.isReconnecting()) return;

		// 如果没有主机 PeerId，无法重连
		if (!this.currentHostPeerId) {
			this.handleDisconnect();
			return;
		}

		// 停止心跳
		this.pauseHeartBeat();

		// 创建重连管理器
		this.reconnectionManager = new ReconnectionManager(
			async () => {
				// 重连函数：尝试重新连接主机
				await this.performReconnect();
			},
			{
				retryInterval: 3000,
				maxRetries: Number.POSITIVE_INFINITY, // 无限重试
				showCountdown: true,
				onRetry: (attempt, maxRetries) => {
					console.log(`[MonopolyClient] 重连尝试 ${attempt}/${maxRetries === Number.POSITIVE_INFINITY ? '∞' : maxRetries}`);
				},
				onSuccess: () => {
					console.log('[MonopolyClient] 重连成功');
					// isOnline 状态已由 ReconnectionManager 管理
					this.resumeHeartBeat();
				},
				onFail: (error) => {
					console.error('[MonopolyClient] 重连失败:', error);
					FPMessage({
						type: "error",
						message: `重连失败: ${error.message}`,
						onClosed: () => {
							this.handleDisconnect();
						},
					});
				},
				onCancel: () => {
					console.log('[MonopolyClient] 用户取消重连');
					this.handleDisconnect();
				}
			}
		);

		// 开始重连
		this.reconnectionManager.start();
	}

	/**
	 * 执行重连操作
	 */
	private async performReconnect(): Promise<void> {
		if (!this.currentHostPeerId) {
			throw new Error('无法重连：主机 PeerId 丢失');
		}

		// 清理旧连接
		if (this.conn) {
			this.conn.removeAllListeners();
			this.conn.close();
			this.conn = null;
		}

		// 使用现有的 peerClient 重新连接
		if (!this.peerClient) {
			throw new Error('无法重连：PeerClient 不存在');
		}

		const { conn } = await this.peerClient.linkToHost(this.currentHostPeerId);
		this.conn = conn;
		this.bindConnectionHandlers(conn);

		// 重新发送加入房间消息
		const { userId, username, color, avatar } = useUserInfo();
		const roomUser = useRoomInfo().userList.find((user) => user.userId === userId);
		const user: User = {
			userId,
			username,
			color,
			avatar,
			isReady: Boolean(roomUser?.isReady), // 恢复准备状态
		};
		this.isOnline = true;
		this.sendMsg({ type: SocketMsgType.JoinRoom, source: SocketMsgSource.Client, data: user });
	}

	/**
	 * 取消重连
	 */
	public cancelReconnection(): void {
		if (this.reconnectionManager) {
			this.reconnectionManager.cancel();
			this.reconnectionManager = null;
		}
	}

	/**
	 * 是否正在重连
	 */
	public isReconnecting(): boolean {
		return this.reconnectionManager?.isReconnecting() ?? false;
	}

	public handleHeartReply() {
		useUtil().ping = Math.round((Date.now() - this.sendHeartTime) / 2);
		this.handleNoHeartTimer?.fn();
	}

	public initHeartBeat() {
		// 在首次发送心跳时初始化心跳超时定时器
		this.handleNoHeartTimer?.cancel();
		this.handleNoHeartTimer = debounce(
			() => {
				this.isOnline = false;
				this.startReconnection();
			},
			this.heartbeatTimeoutMs,
			true,
		);
		this.handleNoHeartTimer.fn();
	}

	public pauseHeartBeat() {
		this.heartBeatPaused = true;
		this.handleNoHeartTimer?.cancel();
	}

	public resumeHeartBeat() {
		this.heartBeatPaused = false;
		this.handleNoHeartTimer?.fn();
	}

	public sendLoadingStarted() {
		this.sendMsg({
			type: SocketMsgType.Operation,
			source: SocketMsgSource.Client,
			data: { operateType: OperateType.LoadingStarted, data: undefined },
		});
	}

	private handleDisconnect() {
		useGameData().$reset();
		useRoomInfo().$reset();
		useChat().$reset();
		useGameLog().$reset();
		router.replace({ name: "room-router" });
		this.destory();
	}

	public sendRoomChatMessage(message: string, roomId: string) {
		this.sendMsg({ type: SocketMsgType.RoomChat, source: SocketMsgSource.Client, data: message });
	}

	public async leaveRoom() {
		// 1. 立即设置离线状态，防止心跳超时处理程序触发
		this.isOnline = false;

		// 2. 向服务器发送退出房间消息
		await this.sendMsg({ type: SocketMsgType.LeaveRoom, source: SocketMsgSource.Client, data: undefined });

		// 3. 立即清理所有心跳定时器，但保留连接让服务器处理退出逻辑
		this.intervalList.forEach((timer) => clearInterval(timer));
		this.intervalList = [];

		// 4. 取消心跳超时的 debounce 定时器
		if (this.handleNoHeartTimer) {
			this.handleNoHeartTimer.cancel();
			this.handleNoHeartTimer = null;
		}
	}

	public readyToggle() {
		this.sendMsg({ type: SocketMsgType.ReadyToggle, source: SocketMsgSource.Client, data: undefined });
	}

	public changeColor(newColor: string) {
		this.sendMsg({ type: SocketMsgType.ChangeColor, source: SocketMsgSource.Client, data: newColor });
	}

	public kickOut(playerId: string) {
		this.sendMsg({ type: SocketMsgType.KickOut, source: SocketMsgSource.Client, data: playerId });
	}

	public changeRole(roleId: string) {
		this.sendMsg({ type: SocketMsgType.ChangeRole, source: SocketMsgSource.Client, data: roleId });
	}

	public changeGameMap(msg: RoomMapInfo) {
		this.sendMsg({ type: SocketMsgType.ChangeMap, source: SocketMsgSource.Client, data: msg });
	}

	public changeGameSetting(gameSetting: GameSetting) {
		this.sendMsg({ type: SocketMsgType.ChangeGameSetting, source: SocketMsgSource.Client, data: gameSetting });
	}

	public startGame() {
		this.sendMsg({ type: SocketMsgType.GameStart, source: SocketMsgSource.Client, data: undefined });
	}

	public requestSave(): void {
		if (this.gameHost) {
			this.gameHost.getRoom().requestSave();
		}
	}

	public async loadSave(record: any, usePrevious: boolean = false): Promise<{ success: boolean; error?: string }> {
		if (this.gameHost) {
			return this.gameHost.getRoom().loadSave(record, usePrevious);
		}
		return { success: false, error: "未连接到主机" };
	}

	public gameInitFinished() {
		this.sendMsg({
			type: SocketMsgType.Operation,
			source: SocketMsgSource.Client,
			data: { operateType: OperateType.GameInitFinished, data: undefined },
		});
	}

	public rollDice() {
		// 客户端立即锁定，防止重复点击
		const utilStore = useUtil();
		utilStore.startAnimation();

		this.sendMsg({
			type: SocketMsgType.Operation,
			source: SocketMsgSource.Client,
			data: { operateType: OperateType.RollDice, data: undefined },
		});
	}

	public useChanceCard(chanceCardId: string, targetIdList: string[]) {
		// 客户端立即锁定，防止重复点击
		const utilStore = useUtil();
		utilStore.startAnimation();

		this.sendMsg({
			type: SocketMsgType.Operation,
			source: SocketMsgSource.Client,
			data: {
				operateType: OperateType.UseChanceCard,
				data: { chanceCardId, targetIdList },
			},
		});
	}

	public sendDynamicButtonClick(buttonId: string) {
		this.sendMsg({
			type: SocketMsgType.Operation,
			source: SocketMsgSource.Client,
			data: {
				operateType: OperateType.DynamicButtonClick,
				data: { buttonId, success: true },
			},
		});
	}

	public AnimationComplete(animationId: string) {
		this.sendMsg({
			type: SocketMsgType.Operation,
			source: SocketMsgSource.Client,
			data: {
				operateType: OperateType.Animation,
				data: animationId,
			},
		});

		// 动画完成后解锁状态
		const utilStore = useUtil();
		utilStore.endAnimation();
	}

	public async sendMsg(msg: ClientSocketMessage) {
		this.recordAutomationMessage("out", msg);
		if (this.conn?.open) {
			try {
				await this.conn.send(
					JSON.stringify(msg, (key, value) => {
						if (value === Infinity) return "Infinity";
						if (value === -Infinity) return "-Infinity";
						return value;
					}),
				);
			} catch {
				console.error("Failed to send message:", msg.type);
			}
		}
	}

	private installAutomationBridge() {
		if (!isAutomationMode()) return;
		const automation = window.__AI_LIVE_AUTOMATION__ ?? {};
		automation.messages ??= [];
		window.__AI_LIVE_AUTOMATION__ = automation;
		window.__AI_LIVE_CLIENT_BRIDGE__ = {
			startGame: () => this.startGame(),
			changeRole: (roleId: string) => this.changeRole(roleId),
			changeGameSetting: (gameSetting: GameSetting) => this.changeGameSetting(gameSetting),
			gameInitFinished: () => this.gameInitFinished(),
			rollDice: () => this.rollDice(),
			buyProperty: (accept: boolean) => this.confirmDialog(Boolean(accept)),
			buildHouse: (accept: boolean) => this.confirmDialog(Boolean(accept)),
			confirmDialog: (accept: boolean, id?: string) => this.confirmDialog(Boolean(accept), id),
			sendDynamicButtonClick: (buttonId: string) => this.sendDynamicButtonClick(buttonId),
			useChanceCard: (cardId: string, target?: string | string[]) => this.useChanceCard(cardId, normalizeTargetList(target)),
			animationComplete: (animationId?: string) => {
				if (animationId) this.AnimationComplete(animationId);
			},
			getMessages: (cursor = 0) => {
				const messages = window.__AI_LIVE_AUTOMATION__?.messages ?? [];
				return {
					cursor: messages.length,
					messages: messages.slice(cursor),
				};
			},
			getRoomState: () => {
				const roomStore = useRoomInfo();
				return {
					roomId: roomStore.roomId,
					mapId: roomStore.mapId,
					mapInfo: cloneAutomationPayload(roomStore.mapInfo),
					roleList: cloneAutomationPayload(roomStore.roleList),
					gameSetting: cloneAutomationPayload(roomStore.gameSetting),
					gameSettingForm: cloneAutomationPayload(roomStore.gameSettingForm),
					userList: cloneAutomationPayload(roomStore.userList),
				};
			},
			getSnapshot: () => {
				const userStore = useUserInfo();
				const roomStore = useRoomInfo();
				const gameStore = useGameData();
				const mapStore = useMapData();
				const utilStore = useUtil();
				const players = normalizeAutomationPlayers(gameStore.players);
				const properties = normalizeAutomationProperties(gameStore.properties);
				const selfPlayer = players.find((player: any) => player.id === userStore.userId);
				const mapItems = normalizeAutomationMapItems(mapStore.mapItems);
				return {
					userId: userStore.userId,
					username: userStore.username,
					roomId: roomStore.roomId,
					currentPlayerIdInRound: gameStore.currentPlayerIdInRound,
					currentRound: gameStore.currentRound,
					currentMultiplier: gameStore.currentMultiplier,
					cash: selfPlayer?.money,
					isGameOver: gameStore.isGameOver,
					canRoll: utilStore.canRoll,
					canUseCard: utilStore.canUseCard,
					chanceCards: selfPlayer?.chanceCards ?? [],
					selfPlayer,
					players,
					properties,
					mapItems,
					mapIndexList: mapStore.mapIndex,
					waitingFor: utilStore.waitingFor,
					gameInfo: {
						playerList: players,
						properties,
					},
				};
			},
		};
	}

	private confirmDialog(accept: boolean, id = useUserInfo().userId) {
		this.sendMsg({
			type: SocketMsgType.Operation,
			source: SocketMsgSource.Client,
			data: {
				operateType: OperateType.ConfirmDialogResult,
				data: { id, confirm: accept },
			},
		});
	}

	private recordAutomationMessage(
		direction: AutomationMessageDirection,
		message: ClientSocketMessage | ServerSocketMessage,
	) {
		if (!isAutomationMode() || message.type === SocketMsgType.Heart) return;
		const automation = window.__AI_LIVE_AUTOMATION__ ?? {};
		const messages = automation.messages ?? [];
		automation.messages = messages;
		window.__AI_LIVE_AUTOMATION__ = automation;
		messages.push({
			index: messages.length,
			at: Date.now(),
			direction,
			type: message.type,
			typeName: message.type,
			source: message.source,
			roomId: message.roomId,
			data: cloneAutomationPayload(message.data),
			extra: cloneAutomationPayload(message.extra),
			msg: cloneAutomationPayload(message.msg),
		});
	}

	public destory() {
		// 1. 防止竞态条件，先设置离线状态
		this.isOnline = false;

		// 2. 清理重连管理器
		if (this.reconnectionManager) {
			this.reconnectionManager.destroy();
			this.reconnectionManager = null;
		}

		// 3. 清理所有心跳定时器
		this.intervalList.forEach((timer) => clearInterval(timer));
		this.intervalList = [];

		// 4. 取消心跳超时的 debounce 定时器
		if (this.handleNoHeartTimer) {
			this.handleNoHeartTimer.cancel();
			this.handleNoHeartTimer = null;
		}

		// 5. 移除连接事件监听器并关闭连接
		if (this.conn) {
			this.conn.removeAllListeners();
			this.conn.close();
			this.conn = null;
		}

		// 6. 销毁 Peer 客户端
		if (this.peerClient) {
			this.peerClient.destory();
			this.peerClient = null;
		}

		// 7. 清理游戏主机（如果存在）
		if (this.gameHost) {
			this.gameHost.destory();
			this.gameHost = null;
		}
	}

	public static destoryInstance() {
		if (this.instance) {
			this.instance.destory();
			this.instance = null;
		}
		// 移除 beforeunload 事件监听器
		window.removeEventListener("beforeunload", destoryMonopolyClient);
	}
}

function useMonopolyClient(): MonopolyClient;
function useMonopolyClient(options: MonopolyClientOptions): Promise<MonopolyClient>;
function useMonopolyClient(options?: MonopolyClientOptions) {
	window.addEventListener("beforeunload", destoryMonopolyClient, { once: true });
	return options ? MonopolyClient.getInstance(options) : MonopolyClient.getInstance();
}

function destoryMonopolyClient() {
	try {
		MonopolyClient.getInstance() && MonopolyClient.destoryInstance();
	} catch (e) {
		console.log(e);
	}
}

export { useMonopolyClient, destoryMonopolyClient };

export function isAutomationMode() {
	return (
		Boolean(window.__AI_LIVE_AUTOMATION__) ||
		window.location.search.includes("automation=1") ||
		window.location.hash.includes("automation=1")
	);
}

function normalizeTargetList(target?: string | string[]) {
	if (Array.isArray(target)) return target;
	if (typeof target === "string" && target) return [target];
	return [];
}

function cloneAutomationPayload(value: unknown) {
	if (typeof value === "undefined") return undefined;
	try {
		return JSON.parse(JSON.stringify(value));
	} catch {
		return String(value);
	}
}

function normalizeAutomationPlayers(players: any[] = []) {
	return players.map((player) => ({
		...player,
		chanceCards: normalizeAutomationChanceCards(player?.chanceCards ?? []),
		properties: normalizeAutomationProperties(player?.properties ?? []),
	}));
}

function normalizeAutomationProperties(properties: any[] = []) {
	return properties.map((property) => {
		const owner = property?.owner
			? {
					...property.owner,
					id: property.owner.id ?? property.owner.userId,
					name: property.owner.name ?? property.owner.username,
				}
			: undefined;
		const costList = Array.isArray(property?.costList) ? property.costList : [];
		return {
			...property,
			owner,
			buildingLevel: property?.buildingLevel ?? property?.level ?? 0,
			cost_lv0: property?.cost_lv0 ?? costList[0] ?? 0,
			cost_lv1: property?.cost_lv1 ?? costList[1] ?? 0,
			cost_lv2: property?.cost_lv2 ?? costList[2] ?? 0,
		};
	});
}

function normalizeAutomationChanceCards(chanceCards: any[] = []) {
	return chanceCards.map((card) => ({
		...card,
		describe: card?.describe ?? card?.description ?? "",
		icon: card?.icon ?? card?.iconId ?? "",
	}));
}

function normalizeAutomationMapItems(mapItems: any[] = []) {
	return mapItems.map((mapItem) => ({
		...mapItem,
		property: mapItem?.property ? normalizeAutomationProperties([mapItem.property])[0] : undefined,
		linkto: mapItem?.linkto ? { id: mapItem.linkto.id } : undefined,
	}));
}
