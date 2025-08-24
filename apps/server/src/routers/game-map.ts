import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createGameMap, deleteGameMap, getGameMapList } from "src/db/api/game-map";
import { ResInterface } from "src/interfaces/res";
import { uploadFile } from "src/utils/file-uploader";

export const gameMapRouter = Router();
const gameMapMulter = multer({ dest: "public/gameMap" });

gameMapRouter.post("/create", gameMapMulter.single("game-map"), async (req, res) => {
	if (!req.file) {
		const resContent: ResInterface = {
			status: 400,
			msg: "地图文件上传异常",
		};
		res.status(400).json(resContent);
		return;
	}

	const { originalname, filename, path: _path } = req.file;

	const fileType = path.parse(originalname).ext;
	if (!fileType || ![".fpmap"].includes(fileType)) {
		const resMsg: ResInterface = {
			status: 500,
			msg: "文件后缀名不合法",
		};
		res.status(500).json(resMsg);
		return;
	}

	const oldName = _path;
	const gameMapFilePath = oldName + fileType;

	fs.renameSync(oldName, gameMapFilePath);

	const { name } = req.body;

	if (name) {
		const gameMapFileName = filename + fileType;
		try {
			const gameMapFileUrl = await uploadFile({
				filePath: gameMapFilePath,
				name: gameMapFileName,
				targetPath: `fatpaper/game-map`,
			});
			const user = await createGameMap(name, gameMapFileUrl);
			const resContent: ResInterface = {
				status: 200,
				msg: "添加地图成功",
				data: user,
			};
			res.status(200).json(resContent);
		} catch (e: any) {
			const resContent: ResInterface = {
				status: 500,
				msg: e.message || "数据库处理错误",
			};
			res.status(500).json(resContent);
		}
	} else {
		const resContent: ResInterface = {
			status: 400,
			msg: "请求参数错误",
		};
		res.status(400).json(resContent);
	}
});

gameMapRouter.get("/list", async (req, res, next) => {
	const { page = 1, size = 8 } = req.query;
	try {
		const { gameMapList, total } = await getGameMapList(parseInt(page.toString()), parseInt(size.toString()));
		const resMsg: ResInterface = {
			status: 200,
			data: { total, current: parseInt(page.toString()), gameMapList },
		};
		res.status(200).json(resMsg);
	} catch {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取地图列表失败",
		};
		res.status(500).json(resMsg);
	}
});

gameMapRouter.delete("/delete", async (req, res, next) => {
	const { id } = req.query;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "删除成功",
				data: await deleteGameMap(id.toString()),
			};
			res.status(200).json(resMsg);
		} catch (e) {
			const resMsg: ResInterface = {
				status: 500,
				msg: "数据库请求错误",
			};
			res.status(500).json(resMsg);
		}
	}
});
