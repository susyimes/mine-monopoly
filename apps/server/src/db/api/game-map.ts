import { AppDataSource } from "../dbConnecter";
import { GameMap } from "../entities/GameMap";

const gameMapRepository = AppDataSource.getRepository(GameMap);

export const createGameMap = async (name: string, url: string) => {
	const gameMapToCreate = new GameMap();
	gameMapToCreate.name = name;
	gameMapToCreate.url = url;
	gameMapToCreate.inuse = false;

	return await gameMapRepository.save(gameMapToCreate);
};

export const deleteGameMap = async (id: string) => {
	const gameMap = await gameMapRepository.findOne({
		where: { id },
	});
	if (gameMap) {
		return gameMapRepository.remove(gameMap);
	} else {
		null;
	}
};

export const getGameMapById = async (id: string) => {
	const gameMap = await gameMapRepository.findOne({
		where: { id },
	});
	if (gameMap) {
		return gameMap;
	} else {
		return null;
	}
};

export const getGameMapList = async (page: number, size: number) => {
	const gameMapList = await gameMapRepository.find({
		skip: (page - 1) * size,
		take: size,
	});
	// const total = Math.round((await userRepository.count()) / size);
	const total = await gameMapRepository.count();
	return { gameMapList, total };
};
