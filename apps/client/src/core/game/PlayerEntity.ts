import { GameEntity } from "@src/core/game/GameEntity";
import { PlayerInfo } from "@fatpaper-monopoly/types";

export class PlayerEntity extends GameEntity {
	public playerInfo: PlayerInfo;
	public baseScale: number = 1;

	constructor(size: number, baseUrl: string, fileNameWithoutType: string, playerInfo: PlayerInfo) {
		super(size, baseUrl, fileNameWithoutType);
		this.playerInfo = playerInfo;
	}

	public async doAnimation(name: string, loop: boolean = false) {}

	public async load() {
		const s = await super.load();
		if (this.model) {
			this.model.userData = { id: this.playerInfo.id };
		}
		this.doAnimation("idle", true);
		return s;
	}

	public updatePlayerInfo(playerInfo: PlayerInfo) {
		this.playerInfo = playerInfo;
		this.currentPositionIndex = playerInfo.positionIndex;
	}
}
