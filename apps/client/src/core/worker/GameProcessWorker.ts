import { OperateListener } from "./class/OperateListener";
import { WorkerCommMsg } from "@src/interfaces/worker";
import { WorkerCommType } from "@src/enums/worker";

import ChanceCardNeedTypes from "./base-interface.d.ts?raw";
import Utils from "./class/Utils?raw";
import { SocketMessage } from "@src/interfaces/bace";

const effectFunctionTyps = [ChanceCardNeedTypes, Utils].join("\n");
const operateListener = new OperateListener();
let gameProcess: GameProcess | null = null;

self.postMessage(<WorkerCommMsg>{
	type: WorkerCommType.WorkerReady,
});

self.addEventListener("message", (ev) => {
	const data: WorkerCommMsg = ev.data;
	switch (data.type) {
		case WorkerCommType.LoadGameInfo:
			{
				// const { mapInfo, setting, userList, roomOwnerId } = data.data;
				// gameProcess = new GameProcess(mapInfo, setting, userList, roomOwnerId);
				// gameProcess.start();
			}
			break;
		case WorkerCommType.EmitOperation:
			{
				// const { userId, operateType, data: _data } = data.data;
				// operateListener.emit(userId, operateType, _data);
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

function sendToUsers(userIdList: string[], msg: SocketMessage) {
	self.postMessage(<WorkerCommMsg>{
		type: WorkerCommType.SendToUsers,
		data: {
			userIdList,
			data: msg,
		},
	});
}

(async () => {})();

export class GameProcess {}
