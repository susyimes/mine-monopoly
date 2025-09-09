import { PROTOCOL } from "@fatpaper-monopoly/config";
import { GameMap, GameMapInDb, Role } from "@fatpaper-monopoly/types";
import { loadFromProto } from "@fatpaper-monopoly/utils";
import { RoleInRoom } from "@src/interfaces/bace";
import { useRoomInfo, useRoomList } from "@src/store";

export async function getGameMap(gameMapInfo: GameMapInDb) {
	let mapCache = await window.mapCacheLoader.load(gameMapInfo.id, gameMapInfo.hash);
	console.log("🚀 ~ getGameMap ~ mapCache:", mapCache);
	if (!mapCache) {
		const response = await fetch(`${PROTOCOL}://${gameMapInfo.mapUrl}`);
		const arrayBuffer = await response.arrayBuffer();
		await window.mapCacheLoader.save(gameMapInfo.id, gameMapInfo.hash, arrayBuffer);
		mapCache = arrayBuffer;
	}
	const mapData = await loadFromProto(new Uint8Array(mapCache));
	const gameInfo = JSON.parse(mapData.jsonData) as GameMap;
	return { mapData, gameInfo };
}
