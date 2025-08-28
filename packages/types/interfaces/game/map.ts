import { GamePhaseInfo } from "./game-process";
import { MapItem, IProperty, ChanceCard, MapItemType, Street, Role, MapEvent, GameMapInfo } from "./item";

export interface GameMap {
	id: string;
	info: GameMapInfo;
	mapItems: MapItem[];
	chanceCards: ChanceCard[];
	mapItemTypes: MapItemType[];
	mapIndex: string[];
	streets: Street[];
	roles: Role[];
	inUse: boolean;
	mapEvents: MapEvent[];
	phases: {
		gameRoundStart: GamePhaseInfo[];
		playerRound: GamePhaseInfo[];
		gameRoundEnd: GamePhaseInfo[];
	};
	buildingModelIdList: string[]
}
