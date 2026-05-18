export enum WorkerCommType {
	//Worker Receive
	LoadGameInfo,
	EmitOperation,
	UserOffLine,
	UserReconnect,

	// Debug (dev only)
	DebugGetState,

	//Host Receive
	WorkerReady,
	SendToUsers,
	GameStart,
	GameOver,
	GameProcessReady,

	// ????
	RequestSnapshot,
	SaveSnapshot,
	LoadSaveData,

	// Debug (dev only)
	DebugStateResponse,
}
