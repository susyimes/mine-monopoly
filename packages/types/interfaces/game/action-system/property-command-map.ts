import { IPlayer } from "../game-process";
import { ICommandMap } from "./command";

export interface PropertyCommandMap extends ICommandMap {
	//地产主人
	"property.owner.change": {
		payload: { oldOwner: IPlayer | undefined; newOwner: IPlayer | undefined };
		result: { oldOwner: IPlayer | undefined; newOwner: IPlayer | undefined };
	};

	//地产等级
	"property.level.up": {
		payload: {};
		result: {};
	};

	"property.level.down": {
		payload: {};
		result: {};
	};

	"property.level.set": {
		payload: { oldLevel: number; newLevel: number };
		result: { oldLevel: number; newLevel: number };
	};

	//到达地产
	"property.arrived": {
		payload: { owner: IPlayer | undefined; arrivedPlayer: IPlayer; toll?: number };
		result: { owner: IPlayer | undefined; arrivedPlayer: IPlayer; toll?: number };
	};
}
