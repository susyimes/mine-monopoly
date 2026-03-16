import { OperateType, PlayerOperationResult } from "@mine-monopoly/types";

type OperateListenerItem = {
	isOnce: boolean;
	fn: Function;
};

type EventMap = Map<OperateType, OperateListenerItem[]>;

export class OperateListener {
	private evetnMap: Map<string, EventMap> = new Map();
	private defaultTimeout: number = 15000;  // 全局默认超时（毫秒）
	private timerIdCounter: number = 0;      // 用于生成唯一的定时器ID
	private isPaused: boolean = false;       // 全局暂停状态（摸鱼模式）

	// 定时器数据结构
	private activeTimers: Map<string, {
		playerId: string;
		eventType: OperateType;
		timeoutId: any;
		intervalId?: any;
		startTime: number;          // 开始时间（用于暂停/恢复）
		totalPausedTime: number;    // 累计暂停时长（毫秒）
		timeout: number;            // 原始超时时长
	}> = new Map();

	// 倒计时回调（支持多玩家并发）
	private globalTickCallback: ((timeouts: Array<{
		playerId: string;
		remainingMs: number;
	}>) => void) | null = null;

	constructor() {}

	private setOperateListener<T extends OperateType>(
		playerId: string,
		eventType: T,
		fn: (args: PlayerOperationResult[T]) => void,
		isOnce: boolean,
	) {
		if (!this.evetnMap.has(playerId)) {
			this.evetnMap.set(playerId, new Map());
		}
		const eventTypeMap = this.evetnMap.get(playerId) as EventMap;
		if (!eventTypeMap!.has(eventType)) {
			eventTypeMap.set(eventType, []);
		}
		const eventList = eventTypeMap.get(eventType) as OperateListenerItem[];
		eventList.push({ isOnce, fn });
	}

	public onAsync<T extends OperateType>(playerId: string, eventType: T): Promise<PlayerOperationResult[T]> {
		return new Promise((resolve) => {
			this.setOperateListener(playerId, eventType, resolve, false);
		});
	}

	public onceAsync<T extends OperateType>(playerId: string, eventType: T): Promise<PlayerOperationResult[T]> {
		return new Promise((resolve) => {
			this.setOperateListener(playerId, eventType, resolve, true);
		});
	}

	public on<T extends OperateType>(playerId: string, eventType: T, listener: (res: PlayerOperationResult[T]) => void) {
		this.setOperateListener(playerId, eventType, listener, false);
	}

	public once<T extends OperateType>(
		playerId: string,
		eventType: T,
		listener: (res: PlayerOperationResult[T]) => void,
	) {
		this.setOperateListener(playerId, eventType, listener, true);
	}

	public remove<T extends OperateType>(
		playerId: string,
		eventType: T,
		listener: (...args: any[]) => PlayerOperationResult[T],
	) {
		const playerEvents = this.evetnMap.get(playerId);
		if (!playerEvents) return;
		const eventTypeMap = playerEvents.get(eventType);
		if (!eventTypeMap) return;
		const removeIndex = eventTypeMap.findIndex((fobj) => fobj.fn === listener);
		eventTypeMap.splice(removeIndex, 1);
	}

	public removeAll(playerId: string, eventType?: OperateType) {
		const playerEvents = this.evetnMap.get(playerId);
		if (!playerEvents) return;
		if (eventType) {
			playerEvents.delete(eventType);
		} else {
			this.evetnMap.delete(playerId);
		}
	}

	public setGlobalTickCallback(
		callback: (timeouts: Array<{
			playerId: string;
			remainingMs: number;
		}>) => void
	): void {
		this.globalTickCallback = callback;
	}

	private broadcastAllTimeouts(): void {
		if (!this.globalTickCallback || this.isPaused) return;

		const now = Date.now();
		const timeouts = Array.from(this.activeTimers.values()).map((timerData) => {
			// 计算实际经过的时间（包括暂停时间）
			const elapsed = now - timerData.startTime - timerData.totalPausedTime;
			const remaining = Math.max(0, timerData.timeout - elapsed);
			return {
				playerId: timerData.playerId,
				remainingMs: remaining,
			};
		});

		this.globalTickCallback(timeouts);
	}

	public async onceAsyncWithTimeout<T extends OperateType>(
		playerId: string,
		eventType: T,
		options: {
			timeout?: number;
			defaultValue: PlayerOperationResult[T];
		}
	): Promise<PlayerOperationResult[T]> {
		const timeout = options.timeout ?? this.defaultTimeout;
		const timerKey = this.generateTimerKey();
		const startTime = Date.now();

		return new Promise((resolve) => {
			// 创建操作监听器，包装以处理异常
			const listener = (data: PlayerOperationResult[T]) => {
				try {
					this.clearTimer(timerKey);
					resolve(data);
				} catch (error) {
					// 即使 resolve 抛出异常，也要清理定时器
					this.clearTimer(timerKey);
					throw error;
				}
			};

			this.once(playerId, eventType, listener);

			// 设置倒计时间隔（如果需要广播）
			let intervalId: any;
			if (this.globalTickCallback) {
				intervalId = setInterval(() => {
					this.broadcastAllTimeouts();
				}, 1000);
			}

			// 设置超时
			const timeoutId = setTimeout(() => {
				this.clearTimer(timerKey);
				this.removeAll(playerId, eventType);
				resolve(options.defaultValue);
			}, timeout);

			// 保存定时器引用
			this.activeTimers.set(timerKey, {
				playerId,
				eventType,
				timeoutId,
				intervalId,
				startTime,
				totalPausedTime: 0,
				timeout,
			});
		});
	}

	public pause(): void {
		if (this.isPaused) return;  // 防止重复暂停
		this.isPaused = true;

		// 暂停所有定时器
		this.activeTimers.forEach((timerData) => {
			// 清除 setTimeout
			clearTimeout(timerData.timeoutId);
			// 清除 setInterval
			if (timerData.intervalId) {
				clearInterval(timerData.intervalId);
			}
		});
	}

	public resume(): void {
		if (!this.isPaused) return;
		this.isPaused = false;

		const now = Date.now();
		this.activeTimers.forEach((timerData, timerKey) => {
			// 计算暂停前已经经过的时间
			const elapsedBeforePause = now - timerData.startTime - timerData.totalPausedTime;
			const remaining = timerData.timeout - elapsedBeforePause;

			if (remaining <= 0) {
				// 已经超时，立即触发
				this.removeAll(timerData.playerId, timerData.eventType);
				this.clearTimer(timerKey);
				return;
			}

			// 重新设置 setTimeout
			timerData.timeoutId = setTimeout(() => {
				this.clearTimer(timerKey);
				this.removeAll(timerData.playerId, timerData.eventType);
			}, remaining);

			// 重新设置 setInterval
			if (this.globalTickCallback) {
				timerData.intervalId = setInterval(() => {
					this.broadcastAllTimeouts();
				}, 1000);
			}
		});
	}

	public clearAllTimers(): void {
		this.activeTimers.forEach((timerData, timerKey) => {
			clearTimeout(timerData.timeoutId);
			if (timerData.intervalId) {
				clearInterval(timerData.intervalId);
			}
		});
		this.activeTimers.clear();
	}

	public emit<T extends OperateType>(playerId: string, eventType: T, args?: PlayerOperationResult[T]): boolean {
		const playerEvents = this.evetnMap.get(playerId);
		if (!playerEvents) return false;
		const eventTypeMap = playerEvents.get(eventType);
		if (!eventTypeMap) return false;
		for (let index = 0; index < eventTypeMap.length; index++) {
			const fobj = eventTypeMap[index];
			fobj.fn.apply(null, [args]);
			if (fobj.isOnce) {
				eventTypeMap.splice(index, 1);
				index--;
			}
		}
		return true;
	}

	private generateTimerKey(): string {
		return `timer-${++this.timerIdCounter}`;
	}

	private clearTimer(timerKey: string): void {
		const timerData = this.activeTimers.get(timerKey);
		if (timerData) {
			clearTimeout(timerData.timeoutId);
			if (timerData.intervalId) {
				clearInterval(timerData.intervalId);
			}
			this.activeTimers.delete(timerKey);
		}
	}
}
