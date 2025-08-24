import { _axios } from "@/utils/axios";

export const createGameMap = async (formData: FormData) => {
	const res = await _axios.post("/game-map/create", formData);
	return res;
};

export const getMapsList = async (page: number, size: number) => {
	const { total, gameMapList, current } = (await _axios.get("/game-map/list", { params: { page, size } })) as any;
	return { total, gameMapList, current };
};

export const deleteMap = async (id: string) => {
	return await _axios.delete("/game-map/delete", { params: { id } });
};
