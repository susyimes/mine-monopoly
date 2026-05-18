import { WorkerCommType } from "@src/enums/worker";
import { GameMap, GameSetting, PlayerOperationResult, ServerSocketMessage, UserInRoomInfo } from "@mine-monopoly/types";
import { OperateType } from "@mine-monopoly/types";
import { SaveSnapshot } from "@src/core/save/types";

export type WorkerCommMsg = {
	[K in keyof WorkerCommDataTypeMap]: {
		type: K;
		data: WorkerCommDataTypeMap[K];
	};
}[keyof WorkerCommDataTypeMap];

type EmitOperationResult<T extends OperateType> = { userId: string; operateType: T; data: PlayerOperationResult[T] };

interface WorkerCommDataTypeMap {
	//Worker Receive
	[WorkerCommType.LoadGameInfo]: {
		setting: GameSetting;
		mapInfo: GameMap;
		userList: UserInRoomInfo[];
		roomOwnerId: string;
		saveData?: { snapshot: SaveSnapshot; aiPlayerIds: string[] };
	};
	[WorkerCommType.EmitOperation]: EmitOperationResult<OperateType>;
	[WorkerCommType.UserOffLine]: { userId: string };
	[WorkerCommType.UserReconnect]: { userId: string };

	// Debug (dev only)
	[WorkerCommType.DebugGetState]: undefined;

	//Host Receive
	[WorkerCommType.WorkerReady]: undefined;
	[WorkerCommType.SendToUsers]: { userIdList: string[]; data: ServerSocketMessage };
	[WorkerCommType.GameStart]: undefined;
	[WorkerCommType.GameOver]: undefined;
	[WorkerCommType.GameProcessReady]: undefined;

	// 存档相关
	[WorkerCommType.RequestSnapshot]: undefined;
	[WorkerCommType.SaveSnapshot]: { snapshot: SaveSnapshot };
	[WorkerCommType.LoadSaveData]: { snapshot: SaveSnapshot; aiPlayerIds: string[] };

	// Debug (dev only)
	[WorkerCommType.DebugStateResponse]: { state: GameProcessDebugState | null };
}


/** Debug state snapshot exported from Worker for Inspector */
export interface GameProcessDebugState {
	currentRound: number;
	currentMultiplier: number;
	currentRoundPlayer: string | null;
	currentGamePhase: string | null;
	currentEventName: string;
	isGameOver: boolean;
	gameRuntimeStack: { stackSize: number; isRunning: boolean };
	players: Array<Record<string, any>>;
	properties: Array<Record<string, any>>;
	chanceCardInfos: Array<[string, any]>;
	mapItems: Array<[string, any]>;
	mapEvents: Array<[string, any]>;
	gameLogList: Array<Record<string, any>>;
	customData: Record<string, any>;
	exportData: Record<string, any>;
	gameSetting: GameSetting;
	playerButtons: Array<[string, Array<[string, any]>]>;
	animationCompletionHandlers: string[];
	rankedPlayerIds: string[];
}
