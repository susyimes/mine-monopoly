import "reflect-metadata";
import {AppDataSource} from "./src/db/dbConnecter";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { routerUser } from "./src/routers/user";
import { roomRouter } from "./src/routers/room-router";
import { serverLog } from "./src/utils/logger";
import chalk from "chalk";
import { __APIPORT__, __ICE_SERVER_PORT__, __USERSERVERHOST__ } from "./global.config";
import { roleValidation } from "./src/utils/role-validation";
import { PeerServer } from "peer";

// import { roleValidation } from "./src/utils/role-validation";

async function bootstrap() {
	try {
		await AppDataSource.initialize().then(() => {
			serverLog(`${chalk.bold.bgGreen(" 数据库连接成功 ")}`);
		});

		const app = express();

		app.use(cors());

		app.use("/static", express.static("public"));

		app.use(roleValidation); //身份验证

		app.use(bodyParser.json());

		app.use("/user", routerUser);
		app.use("/room-router", roomRouter);

		app.get("/health", (req, res) => {
			// 在这里进行服务的健康检查，返回适当的响应
			// 为了配合docker-compose按顺序启动
			res.status(200).send("OK");
		});

		app.use(handleError);

		app.listen(__APIPORT__, () => {
			serverLog(`${chalk.bold.bgGreen(` API服务启动成功 ${__APIPORT__}端口`)}`);
		});

		const peerServer = PeerServer({ port: __ICE_SERVER_PORT__ }, () => {
			serverLog(`${chalk.bold.bgGreen(` ICE服务启动成功 ${__ICE_SERVER_PORT__}端口`)}`);
		});
	} catch (e: any) {
		serverLog(`${chalk.bold.bgRed(` 服务器出错: `)}`, "error");
		console.log(e);
	}
}

bootstrap();

const handleError: ErrorRequestHandler = (err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send(`服务器错误:${err.message}`);
};
