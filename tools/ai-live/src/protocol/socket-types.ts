export enum SocketMsgType {
  Heart = "Heart",
  MsgNotify = "MsgNotify",
  GameLog = "GameLog",
  UserList = "UserList",
  RoomList = "RoomList",
  JoinRoom = "JoinRoom",
  LeaveRoom = "LeaveRoom",
  RoomInfo = "RoomInfo",
  RoomChat = "RoomChat",
  ReadyToggle = "ReadyToggle",
  ChangeColor = "ChangeColor",
  KickOut = "KickOut",
  ChangeMap = "ChangeMap",
  ChangeRole = "ChangeRole",
  ChangeGameSetting = "ChangeGameSetting",
  GameStart = "GameStart",
  GameInit = "GameInit",
  GameInitFinished = "GameInitFinished",
  GameData = "GameData",
  GameInfo = "GameData",
  GainMoney = "GainMoney",
  CostMoney = "CostMoney",
  RoundTurn = "RoundTurn",
  RollDiceStart = "RollDiceStart",
  RollDiceResult = "RollDiceResult",
  UseChanceCard = "UseChanceCard",
  RemainingTime = "RemainingTime",
  CurrentEventName = "CurrentEventName",
  RoundTimeOut = "RoundTimeOut",
  PlayerWalk = "PlayerWalk",
  PlayerTp = "PlayerTp",
  Operation = "Operation",
  ConfirmDialog = "ConfirmDialog",
  TargetSelectDialog = "TargetSelectDialog",
  ItemSelectDialog = "ItemSelectDialog",
  FormDialog = "FormDialog",
  ButtonRegister = "ButtonRegister",
  ButtonStateChanged = "ButtonStateChanged",
  ButtonRemove = "ButtonRemove",
  Animation = "Animation",
  BuyProperty = "BuyProperty",
  BuildHouse = "BuildHouse",
  Bankrupt = "Bankrupt",
  GameOver = "GameOver",
  PauseGame = "PauseGame",
  ResumeGame = "ResumeGame"
}

export enum OperateType {
  GameInitFinished = "GameInitFinished",
  RollDice = "RollDice",
  UseChanceCard = "UseChanceCard",
  Animation = "AnimationComplete",
  BuyProperty = "BuyProperty",
  BuildHouse = "BuildHouse",
  ConfirmDialogResult = "ConfirmDialogResult",
  DynamicButtonClick = "DynamicButtonClick",
  PauseGame = "PauseGame",
  ResumeGame = "ResumeGame"
}

export enum GameOverRule {
  OnePlayerGoBroke,
  LeftOnePlayer,
  Earn100000
}

export enum ChanceCardType {
  ToSelf = "ToSelf",
  ToOtherPlayer = "ToOtherPlayer",
  ToPlayer = "ToPlayer",
  ToProperty = "ToProperty",
  ToMapItem = "ToMapItem"
}

export type SocketNoticeType = "info" | "success" | "warning" | "error" | "";

export interface SocketMessage<TData = unknown, TExtra = unknown> {
  type: SocketMsgType;
  source: string;
  roomId?: string;
  data: TData;
  msg?: {
    type: SocketNoticeType;
    content: string;
  };
  extra?: TExtra;
}

export interface GuestUser {
  userId: string;
  useraccount: string;
  username: string;
  avatar: string;
  color: string;
}

export interface Role {
  id: string;
  baseUrl: string;
  roleName: string;
  fileName: string;
  color: string;
}

export interface User extends GuestUser {
  isReady: boolean;
}

export interface UserInRoomInfo extends User {
  role?: Role;
  isOffLine?: boolean;
}

export interface GameSettingSnapshot {
  gameOverRule?: GameOverRule;
  initMoney: number;
  multiplier: number;
  multiplierIncreaseRounds: number;
  roundTime: number;
  mapId: string;
  diceNum: number;
  chanceCardVisible: boolean;
  overMoney: number;
  slackOffMode: boolean;
}

export interface RoomInfo {
  roomId: string;
  userList: UserInRoomInfo[];
  isStarted: boolean;
  ownerId: string;
  ownerName: string;
  roleList: Role[];
  gameSetting: GameSettingSnapshot;
}

export interface PropertyOwnerInfo {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface PropertyInfo {
  id: string;
  name: string;
  buildingLevel: number;
  buildCost: number;
  sellCost: number;
  cost_lv0: number;
  cost_lv1: number;
  cost_lv2: number;
  owner?: PropertyOwnerInfo;
}

export interface ChanceCardInfo {
  id: string;
  sourceId?: string;
  name: string;
  describe: string;
  color: string;
  type: ChanceCardType | string;
  icon: string;
}

export interface MapItemInfo {
  id: string;
  x?: number;
  y?: number;
  rotation?: number;
  arrivedEvent?: unknown;
  type?: unknown;
  linkto?: MapItemInfo;
  property?: PropertyInfo;
}

export interface PlayerInfo {
  id: string;
  user: UserInRoomInfo;
  money: number;
  properties: PropertyInfo[];
  chanceCards: ChanceCardInfo[];
  buff: unknown[];
  positionIndex: number;
  stop: number;
  isBankrupted: boolean;
  isOffline: boolean;
}

export interface GameInfo {
  currentPlayerInRound: string;
  currentRound: number;
  currentMultiplier: number;
  playerList: PlayerInfo[];
  properties: PropertyInfo[];
}

export interface GameInitInfo extends GameInfo {
  mapId: string;
  mapName: string;
  mapBackground: string;
  mapItemsList: MapItemInfo[];
  mapIndexList: string[];
  itemTypesList: unknown[];
  chanceCards: ChanceCardInfo[];
  streetsList: unknown[];
  houseModels: { lv0: unknown; lv1: unknown; lv2: unknown };
}

export interface RemainingTimeData {
  eventMsg: string;
  remainingTime: number;
}

export interface RollDiceResultData {
  rollDiceResult: number[];
  rollDiceCount: number;
  rollDicePlayerId: string;
}

export interface PlayerWalkData {
  playerId: string;
  step: number;
  walkId: string;
}

export interface PlayerTpData {
  playerId: string;
  positionIndex: number;
  walkId: string;
}

export type PropertyPromptMessage = SocketMessage<PropertyInfo>;

export function parseSocketMessage(raw: string | SocketMessage): SocketMessage {
  if (typeof raw !== "string") return raw;
  return JSON.parse(raw) as SocketMessage;
}

export function isSocketMessage(value: unknown): value is SocketMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string" &&
    "source" in value
  );
}

export function socketTypeName(type: SocketMsgType): string {
  return type;
}

export function findPlayer(gameInfo: GameInfo | GameInitInfo | undefined, userId: string): PlayerInfo | undefined {
  return gameInfo?.playerList.find((player) => player.id === userId || player.user.userId === userId);
}

export function findRoomUser(roomInfo: RoomInfo | undefined, userId: string): UserInRoomInfo | undefined {
  return roomInfo?.userList.find((user) => user.userId === userId);
}
