import { defineStore } from "pinia";
import { User, Room, ChatMessage, UserInRoomInfo, GameLog, RoleInRoom } from "@src/interfaces/bace";
import {
	MapItem,
	PlayerInfo,
	PropertyInfo,
	MapItemType,
	ChanceCardInfo,
	Street,
	GameMap,
	Role,
	ResourcesType,
} from "@fatpaper-monopoly/types";
import { GameOverRule } from "@fatpaper-monopoly/types";
import { isFullScreen, isLandscape, setTimeOutAsync } from "@src/utils";
import { getUserByToken } from "@src/utils/api/user";

export const useLoading = defineStore("loading", {
	state: () => {
		return {
			loading: false,
			text: "",
		};
	},
	actions: {
		showLoading(text: string) {
			this.text = text;
			this.loading = true;
		},
		hideLoading() {
			this.loading = false;
		},
	},
});

export const useUserInfo = defineStore("userInfo", {
	state: () => {
		return {
			userId: "",
			useraccount: "",
			username: "",
			avatar: "",
			color: "",
		};
	},
	actions: {
		hasUserInfo() {
			return Boolean(this.userId);
		},
	},
});

export const useUserList = defineStore("userList", {
	state: () => {
		return {
			userList: new Array<User>(),
		};
	},
});

export const useRoomList = defineStore("roomList", {
	state: () => {
		return {
			roomList: new Array<Room>(),
		};
	},
});

export const useRoomInfo = defineStore("roomInfo", {
	state: () => {
		return {
			mapId: "",
			roomId: "",
			ownerId: "",
			ownerName: "",
			userList: new Array<UserInRoomInfo>(),
			gameSetting: {
				gameOverRule: GameOverRule.LeftOnePlayer,
				initMoney: 20000,
				multiplier: 1,
				multiplierIncreaseRounds: 2,
				roundTime: 15,
				diceNum: 2,
				chanceCardVisible: true,
				overMoney: 100000,
			},
		};
	},
	actions: {},
	getters: {
		amIRoomOwner: (state) => useUserInfo().userId === state.ownerId,
	},
});

export const useResourceStore = defineStore("temp-resource", {
	state: () => {
		return {
			recourceMap: new Map<string, ResourcesType>(),
		};
	},
	actions: {
		add(recource: ResourcesType) {
			this.recourceMap.set(recource.id, recource);
		},
		remove(id: string) {
			const recource = this.recourceMap.get(id);
			if (!recource) return;
			URL.revokeObjectURL(recource.url);
			this.recourceMap.delete(id);
		},
		getRecourceById(id: string) {
			return this.recourceMap.get(id);
		},
		clear() {
			Array.from(this.recourceMap.values()).forEach((r) => {
				URL.revokeObjectURL(r.url);
			});
			this.recourceMap.clear();
		},
	},
});

export const useMapData = defineStore("map", {
	state: (): GameMap => ({
		id: crypto.randomUUID(),
		info: {
			name: "",
			version: "0.0.0",
			backgroundImageId: "",
			coverImageId: "",
		},
		mapItems: [],
		chanceCards: [],
		mapItemTypes: [],
		mapIndex: [],
		streets: [],
		roles: [],
		inUse: false,
		mapEvents: [],
		phases: {
			gameRoundStart: [],
			playerRound: [],
			gameRoundEnd: [],
		},
		buildingModelIdList: ["", "", ""],
	}),
	actions: {
		getMapEventByMapItemId(mapItemId: string) {
			const mapEventId = this.findMapItemById(mapItemId)?.mapEventId;
			if (!mapEventId) throw Error("查找MapEvent的Id失败");
			return this.findMapEventById(mapEventId);
		},

		// MapItem
		findMapItemByIndex(index: number) {
			return this.findMapItemById(this.mapIndex[index]);
		},
		findMapItemById(id: string) {
			return this.mapItems.find((m) => m.id === id);
		},

		// MapItemType
		findMapItemTypeById(id: string) {
			return this.mapItemTypes.find((m) => m.id === id);
		},

		// MapEvent
		findMapEventById(id: string) {
			return this.mapEvents.find((e) => e.id === id);
		},

		// ChanceCard
		findChanceCardById(id: string) {
			return this.chanceCards.find((c) => c.id === id);
		},

		// Role
		findRoleById(id: string) {
			return this.roles.find((r) => r.id === id);
		},
	},
});

export const useGameData = defineStore("gameData", {
	state: () => {
		return {
			ping: 0,
			currentPlayerIdInRound: "",
			currentRound: 0,
			currentMultiplier: 0,
			playersList: new Array<PlayerInfo>(),
			propertiesList: new Array<PropertyInfo>(),
			isGameOver: false,
		};
	},
	getters: {
		isMyTurn: (state) => useUserInfo().userId === state.currentPlayerIdInRound,
		getMyInfo: (state) => state.playersList.find((p) => p.id === useUserInfo().userId),
		canIOperate: (state) => {
			const _this = useGameData();
			const amIBankrupted = _this.getMyInfo && _this.getMyInfo.isBankrupted;
			return !amIBankrupted && _this.isMyTurn;
		},
	},
	actions: {
		getPlayerInfoById(id: string) {
			return this.$state.playersList.find((p) => p.id === id);
		},
		getPropertyById(id: string) {
			return this.$state.propertiesList.find((p) => p.id === id);
		},
	},
});

export const useUtil = defineStore("util", {
	state: () => {
		return {
			isRollDiceAnimationPlay: false,
			rollDiceResult: new Array<number>(),
			waitingFor: { eventMsg: "", remainingTime: 0 },
			timeOut: false,
			canUseCard: useGameData().canIOperate,
			canRoll: useGameData().canIOperate,
		};
	},
});

export const useChat = defineStore("chat", {
	state: (): {
		visible: boolean;
		messageLimit: number;
		chatMessageQueue: Array<ChatMessage>;
		newMessage: ChatMessage | undefined;
		newMessageNum: number;
	} => {
		return {
			visible: false,
			messageLimit: 30,
			chatMessageQueue: new Array<ChatMessage>(),
			newMessage: undefined,
			newMessageNum: 0,
		};
	},
	actions: {
		addNewMessage(_newMessage: ChatMessage) {
			this.chatMessageQueue.push(_newMessage);
			this.newMessage = _newMessage;
			if (!this.visible) this.newMessageNum += 1;
			if (this.chatMessageQueue.length > this.messageLimit) {
				this.chatMessageQueue.shift();
			}
		},
		resetNewMessageNum() {
			this.newMessageNum = 0;
		},
	},
});

export const useGameLog = defineStore("gameLog", {
	state: (): {
		visible: boolean;
		logLimit: number;
		gameLogQueue: Array<GameLog>;
	} => {
		return {
			visible: false,
			logLimit: 30,
			gameLogQueue: new Array<GameLog>(),
		};
	},
	actions: {
		addNewLog(_newLog: GameLog) {
			this.gameLogQueue.push(_newLog);
			if (this.gameLogQueue.length > this.logLimit) {
				this.gameLogQueue.shift();
			}
		},
	},
});

export const useDeviceStatus = defineStore("deviceStatus", {
	state: () => {
		return {
			isFullScreen: false,
			isLandscape: false,
			isMobile: false,
			isFocus: false,
		};
	},
});

export const useSettig = defineStore("setting", {
	state: () => {
		return {
			autoMusic: true,
			musicVolume: 1,
			lockRole: true,
		};
	},
});
