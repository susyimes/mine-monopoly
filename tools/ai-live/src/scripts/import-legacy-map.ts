import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { GameMap as ProtoGameMap } from "../../../../packages/utils/protos/game-map.js";

type LegacyMap = {
	id: string;
	name: string;
	background: string | null;
	indexList: string;
	inUse: number;
};

type LegacyMapItem = {
	id: string;
	x: number;
	y: number;
	rotation: number;
	typeId: string;
	linktoId: string | null;
	propertyId: string | null;
	mapEventId: string | null;
};

type LegacyItemType = {
	id: string;
	color: string;
	name: string;
	size: number;
};

type LegacyProperty = {
	id: string;
	name: string;
	sellCost: number;
	buildCost: number;
	cost_lv0: number;
	cost_lv1: number;
	cost_lv2: number;
};

type LegacyEvent = {
	id: string;
	name: string;
	description: string;
	effectCode: string;
};

type LegacyChanceCard = {
	id: string;
	name: string;
	description: string;
	color: string;
	type: string;
	effectCode: string;
};

type QueryValue = string | number | null | boolean;
type ProtoFileType = {
	id: string;
	name: string;
	filetype: string;
	buffer: Uint8Array;
};

const TILE_MODEL_ID = "tile-model";
const HOUSE_MODEL_ID = "house-model";
const COVER_IMAGE_ID = "cover-image";
const BG_IMAGE_ID = "bg-image";
const ROLE_IMAGE_ID = "role-image";

async function main() {
	const root = findRepoRoot();
	const args = parseArgs(process.argv.slice(2));
	const oldDbContainer = args["old-db-container"] ?? "mysql";
	const newDbContainer = args["new-db-container"] ?? "mine-monopoly-ai-live-mysql";
	const newMapId = args["new-map-id"] ?? "legacy-town-rich-map";
	const serverUrl = (args["server-url"] ?? "http://localhost:8181").replace(/\/$/, "");
	const legacyMapId = args["legacy-map-id"];
	const shouldSeed = !Object.hasOwn(args, "no-seed");

	const legacyMap = queryJson<LegacyMap>(
		oldDbContainer,
		`SELECT JSON_OBJECT(
			'id', id,
			'name', name,
			'background', background,
			'indexList', indexList,
			'inUse', inUse
		) FROM map ${legacyMapId ? `WHERE id = ${sqlString(legacyMapId)}` : "WHERE inUse = 1"} LIMIT 1;`
	);
	if (!legacyMap) throw new Error("legacy map not found");

	const itemTypes = queryJson<LegacyItemType[]>(
		oldDbContainer,
		`SELECT JSON_ARRAYAGG(JSON_OBJECT(
			'id', it.id,
			'color', it.color,
			'name', it.name,
			'size', it.size
		)) FROM item_type it
		WHERE it.id IN (SELECT DISTINCT typeId FROM map_item WHERE mapId = ${sqlString(legacyMap.id)});`
	) ?? [];
	const properties = queryJson<LegacyProperty[]>(
		oldDbContainer,
		`SELECT JSON_ARRAYAGG(JSON_OBJECT(
			'id', id,
			'name', name,
			'sellCost', sellCost,
			'buildCost', buildCost,
			'cost_lv0', cost_lv0,
			'cost_lv1', cost_lv1,
			'cost_lv2', cost_lv2
		)) FROM property WHERE mapId = ${sqlString(legacyMap.id)};`
	) ?? [];
	const mapItems = queryJson<LegacyMapItem[]>(
		oldDbContainer,
		`SELECT JSON_ARRAYAGG(JSON_OBJECT(
			'id', id,
			'x', x,
			'y', y,
			'rotation', rotation,
			'typeId', typeId,
			'linktoId', linktoId,
			'propertyId', propertyId,
			'mapEventId', arrivedEventId
		)) FROM map_item WHERE mapId = ${sqlString(legacyMap.id)};`
	) ?? [];
	const mapEvents = queryJson<LegacyEvent[]>(
		oldDbContainer,
		`SELECT JSON_ARRAYAGG(JSON_OBJECT(
			'id', id,
			'name', name,
			'description', \`describe\`,
			'effectCode', effectCode
		)) FROM arrived_event
		WHERE id IN (
			SELECT DISTINCT arrivedEventId FROM map_item
			WHERE mapId = ${sqlString(legacyMap.id)} AND arrivedEventId IS NOT NULL
		);`
	) ?? [];
	const chanceCards = queryJson<LegacyChanceCard[]>(
		oldDbContainer,
		`SELECT JSON_ARRAYAGG(JSON_OBJECT(
			'id', id,
			'name', name,
			'description', \`describe\`,
			'color', color,
			'type', type,
			'effectCode', effectCode
		)) FROM chance_card;`
	) ?? [];

	const baseMapPath = resolve(root, "apps/server/public/ai-live/ai-live-test.fpmap");
	const base = await loadFromProto(new Uint8Array(readFileSync(baseMapPath)));
	const baseMap = JSON.parse(base.jsonData);
	const compatibleEditorVersion = typeof baseMap.info?.editorVersion === "string" ? baseMap.info.editorVersion : "1.1.4";
	const outputDir = resolve(root, "apps/server/public/ai-live");
	const outputMapPath = resolve(outputDir, "legacy-town-rich.fpmap");
	const outputCoverPath = resolve(outputDir, "legacy-town-rich-cover.png");
	mkdirSync(dirname(outputMapPath), { recursive: true });

	const typeById = new Map(itemTypes.map((type) => [type.id, type]));
	const propertyById = new Map(properties.map((property) => [property.id, property]));

	const gameMap = {
		id: newMapId,
		info: {
			name: legacyMap.name,
			author: "Legacy import",
			version: "1.0.0",
			editorVersion: compatibleEditorVersion,
			description: `Imported from legacy map ${legacyMap.name} (${legacyMap.id}) for 4-bot AI live validation.`,
			backgroundImageId: BG_IMAGE_ID,
			coverImageId: COVER_IMAGE_ID,
		},
		mapItems: mapItems.map((item) => {
			const type = typeById.get(item.typeId) ?? {
				id: item.typeId,
				color: "#6c8cff",
				name: "legacy tile",
				size: 1,
			};
			const property = item.propertyId ? propertyById.get(item.propertyId) : undefined;
			return {
				id: item.id,
				type: {
					id: type.id,
					color: type.color,
					name: type.name,
					modelId: TILE_MODEL_ID,
					size: type.size || 1,
				},
				x: item.x,
				y: item.y,
				rotation: normalizeRotation(item.rotation),
				mapEventId: item.mapEventId ?? undefined,
				linkto: item.linktoId ?? undefined,
				property: property
					? {
							id: property.id,
							name: property.name,
							sellCost: property.sellCost,
							buildCost: property.buildCost,
							level: 0,
							maxLevel: 2,
							costList: [property.cost_lv0, property.cost_lv1, property.cost_lv2],
							buildingModelIdList: [HOUSE_MODEL_ID, HOUSE_MODEL_ID, HOUSE_MODEL_ID],
							customUI: undefined,
						}
					: undefined,
			};
		}),
		chanceCards: chanceCards.map((card) => ({
			id: card.id,
			name: card.name,
			description: card.description,
			iconId: COVER_IMAGE_ID,
			color: card.color,
			type: card.type,
			effectCode: wrapLegacyEffect(`chance card ${card.name}`, "sourcePlayer, target, gameProcess", card.effectCode, false),
		})),
		mapItemTypes: itemTypes.map((type) => ({
			id: type.id,
			color: type.color,
			name: type.name,
			modelId: TILE_MODEL_ID,
			size: type.size || 1,
		})),
		mapIndex: legacyMap.indexList.split(",").map((id) => id.trim()).filter(Boolean),
		roles: baseMap.roles?.length ? baseMap.roles : createFallbackRoles(),
		inUse: true,
		mapEvents: mapEvents.map((event) => ({
			id: event.id,
			type: "ArrivedEvent",
			name: event.name,
			description: event.description,
			iconId: COVER_IMAGE_ID,
			effectCode: wrapLegacyEffect(`map event ${event.name}`, "arrivedPlayer, gameProcess", event.effectCode, true),
		})),
		gameSettingForm: [
			{ id: "gs-init-money", key: "initMoney", type: "number-input", label: "初始金钱", defaultValue: 10000, builtIn: true },
			{ id: "gs-turn-timeout", key: "turnTimeout", type: "number-input", label: "回合倒计时(秒)", defaultValue: 15, min: 5, max: 120, builtIn: true },
		],
		phases: createStablePhases(),
		buildingModelIdList: [HOUSE_MODEL_ID, HOUSE_MODEL_ID, HOUSE_MODEL_ID],
		uiTemplates: [],
		modifierTemplates: [],
		customUIs: [],
		extraLibs: "",
	};

	const buffer = dataToProtoBuffer(newMapId, JSON.stringify(gameMap), base.modelFiles, base.imageFiles);
	writeFileSync(outputMapPath, Buffer.from(buffer));
	const cover = base.imageFiles.find((file) => file.id === COVER_IMAGE_ID) ?? base.imageFiles[0];
	if (cover) writeFileSync(outputCoverPath, Buffer.from(cover.buffer));

	const hash = createHash("sha256").update(Buffer.from(buffer)).digest("hex");
	if (shouldSeed) {
		const coverUrl = `${serverUrl}/static/ai-live/legacy-town-rich-cover.png`;
		const mapUrl = `${serverUrl}/static/ai-live/legacy-town-rich.fpmap`;
		runMysql(
			newDbContainer,
			`INSERT INTO game_map (id, name, author, version, description, coverUrl, mapUrl, hash, inuse)
			VALUES (
				${sqlString(newMapId)},
				${sqlString(legacyMap.name)},
				'Legacy import',
				'1.0.0',
				${sqlString(`Imported from legacy map ${legacyMap.id}`)},
				${sqlString(coverUrl)},
				${sqlString(mapUrl)},
				${sqlString(hash)},
				1
			)
			ON DUPLICATE KEY UPDATE
				name = VALUES(name),
				author = VALUES(author),
				version = VALUES(version),
				description = VALUES(description),
				coverUrl = VALUES(coverUrl),
				mapUrl = VALUES(mapUrl),
				hash = VALUES(hash),
				inuse = VALUES(inuse);`
		);
	}

	console.log(JSON.stringify({
		legacyMap: { id: legacyMap.id, name: legacyMap.name },
		newMapId,
		outputMapPath,
		outputCoverPath,
		seeded: shouldSeed,
		mapItems: gameMap.mapItems.length,
		mapIndex: gameMap.mapIndex.length,
		properties: properties.length,
		mapEvents: mapEvents.length,
		chanceCards: chanceCards.length,
		hash,
	}, null, 2));
}

function findRepoRoot() {
	let current = process.cwd();
	while (!existsSync(resolve(current, "pnpm-workspace.yaml"))) {
		const parent = dirname(current);
		if (parent === current) throw new Error("could not locate repo root");
		current = parent;
	}
	return current;
}

function parseArgs(argv: string[]) {
	const args: Record<string, string | boolean> = {};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg.startsWith("--")) continue;
		const key = arg.slice(2);
		const next = argv[index + 1];
		if (!next || next.startsWith("--")) {
			args[key] = true;
			continue;
		}
		args[key] = next;
		index += 1;
	}
	return args as Record<string, string>;
}

function queryJson<T>(container: string, sql: string): T | null {
	const output = runMysql(container, sql).trim();
	const line = output.split(/\r?\n/).find((item) => /^[\[{]/.test(item.trim()));
	return line ? JSON.parse(line) as T : null;
}

function runMysql(container: string, sql: string) {
	return execFileSync(
		"docker",
		[
			"exec",
			container,
			"mysql",
			"--default-character-set=utf8mb4",
			"-uroot",
			"-proot",
			"monopoly",
			"--batch",
			"--raw",
			"--skip-column-names",
			"-e",
			sql,
		],
		{ encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
	);
}

function sqlString(value: QueryValue) {
	if (value === null) return "NULL";
	if (typeof value === "number") return String(value);
	if (typeof value === "boolean") return value ? "1" : "0";
	return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function normalizeRotation(value: number): 0 | 1 | 2 | 3 {
	return (((value % 4) + 4) % 4) as 0 | 1 | 2 | 3;
}

async function loadFromProto(buffer: Uint8Array): Promise<{ id: string; jsonData: string; modelFiles: ProtoFileType[]; imageFiles: ProtoFileType[] }> {
	const decoded = ProtoGameMap.decode(new Uint8Array(buffer));
	return {
		id: decoded.id,
		jsonData: decoded.jsonData,
		modelFiles: (decoded.modelFiles || []).map((file: any) => ({
			id: file.id,
			name: file.name,
			filetype: file.filetype,
			buffer: file.content,
		})),
		imageFiles: (decoded.imageFiles || []).map((file: any) => ({
			id: file.id,
			name: file.name,
			filetype: file.filetype,
			buffer: file.content,
		})),
	};
}

function dataToProtoBuffer(id: string, jsonData: string, modelFiles: ProtoFileType[], imageFiles: ProtoFileType[]): Uint8Array {
	const message = ProtoGameMap.create({
		id,
		jsonData,
		modelFiles: modelFiles.map((file) => ({
			id: file.id,
			name: file.name,
			filetype: file.filetype,
			content: file.buffer,
		})),
		imageFiles: imageFiles.map((file) => ({
			id: file.id,
			name: file.name,
			filetype: file.filetype,
			content: file.buffer,
		})),
	});
	return ProtoGameMap.encode(message).finish();
}

function wrapLegacyEffect(name: string, args: string, code: string, swallowErrors: boolean) {
	const body = code.split(/\r?\n/).map((line) => `\t\t${line}`).join("\n");
	const catchBody = swallowErrors
		? `console.warn(${JSON.stringify(`[legacy-map] ${name} skipped`)}, error?.message ?? error);`
		: `console.warn(${JSON.stringify(`[legacy-map] ${name} failed`)}, error?.message ?? error);\n\t\tthrow error;`;
	return `return async (${args}) => {
	const utils = globalThis.utils ?? {
		randomInRange: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
	};
	const PlayerEvents = globalThis.PlayerEvents ?? {
		BeforeRound: "BeforeRound",
		BeforeWalk: "BeforeWalk",
		BeforeCost: "BeforeCost",
		AfterCost: "AfterCost",
		BeforeGain: "BeforeGain",
		BeforeSetBankrupted: "BeforeSetBankrupted",
	};
	try {
${body}
	} catch (error) {
		${catchBody}
	}
};`;
}

function createFallbackRoles() {
	return [
		{ id: "role-red", name: "Red Mimo", description: "AI player", color: "#e1495b", imageId: ROLE_IMAGE_ID, initCode: "return (player, gameProcess) => {};" },
		{ id: "role-blue", name: "Blue Mimo", description: "AI player", color: "#2563eb", imageId: ROLE_IMAGE_ID, initCode: "return (player, gameProcess) => {};" },
		{ id: "role-green", name: "Green Mimo", description: "AI player", color: "#0f9f6e", imageId: ROLE_IMAGE_ID, initCode: "return (player, gameProcess) => {};" },
		{ id: "role-gold", name: "Gold Mimo", description: "AI player", color: "#c28a13", imageId: ROLE_IMAGE_ID, initCode: "return (player, gameProcess) => {};" },
	];
}

function createStablePhases() {
	return {
		gameOverRule: [{
			id: "phase-legacy-game-over",
			name: "游戏结束判定规则",
			description: "AI live import keeps the game running until the external run timeout unless every player has gone broke.",
			from: "AI live legacy import",
			mark: 0,
			initEventCode: `return async (context, gameProcess) => {
	const players = Array.from(gameProcess.players.values());
	const activePlayers = players.filter((player) => !player.isBankrupted);
	if (gameProcess.currentRound >= 8 && activePlayers.length <= 1 && players.length > 1) {
		return players.sort((a, b) => b.money - a.money).map((player) => player.id);
	}
	return false;
};`,
		}],
		gameInited: [phase("phase-legacy-inited", "游戏初始化结束", 0, "return async (context, gameProcess) => {};")],
		playerPreInit: [phase("phase-legacy-player-pre-init", "玩家预初始化", undefined, "return async (context, gameProcess) => {};")],
		propertyPreInit: [phase("phase-legacy-property-pre-init", "地皮预初始化", undefined, "return async (context, gameProcess) => {};")],
		gameRoundStart: [phase("phase-legacy-round-start", "轮次开始", 0, "return async (context, gameProcess) => {};")],
		playerRound: [
			phase("phase-legacy-player-start", "玩家回合开始", 1, `return async (context, gameProcess) => {
	gameProcess.roundTurnNotify(context.currentRoundPlayer.id);
};`),
			phase("phase-legacy-roll", "玩家操作", 2, `return async (context, gameProcess) => {
	const currentPlayer = context.currentRoundPlayer;
	const currentPlayerId = currentPlayer.id;

	function listenPlayerUseCard() {
		gameProcess.oncePlayerOperation(currentPlayerId, OperateType.UseChanceCard, async (res) => {
			const { chanceCardId, targetIdList } = res;
			await gameProcess.handleUseChanceCard(context.currentRoundPlayer, chanceCardId, targetIdList);
			listenPlayerUseCard();
		});
	}
	listenPlayerUseCard();

	await gameProcess.oncePlayerOperationAsync(currentPlayerId, OperateType.RollDice);
	gameProcess.removePlayerAllOperationListener(currentPlayerId, OperateType.UseChanceCard);
	gameProcess.roundTimeTimer.pause();
	gameProcess.gameBroadcast({ type: SocketMsgType.RollDiceStart, data: "", source: SocketMsgSource.Server });

	const diceResult = await currentPlayer.rollDices();
	context.diceResult = diceResult;
	gameProcess.gameBroadcast({
		type: SocketMsgType.RollDiceResult,
		source: SocketMsgSource.Server,
		data: {
			rollDiceResult: context.diceResult,
			rollDicePlayerId: currentPlayer.id,
		},
		msg: {
			type: "info",
			content: \`\${currentPlayer.name} 摇到的点数是: \${context.diceResult.map(d => d.result).join("-")}\`,
		},
	});
	await new Promise((resolve) => setTimeout(resolve, 3000));
};`),
			phase("phase-legacy-move", "玩家移动", 3, `return async (context, gameProcess) => {
	const player = context.currentRoundPlayer;
	await player.walk(context.diceResult.map(d => d.result).reduce((previous, current) => previous + current, 0));
	context.targetIndex = player.positionIndex;
};`),
			phase("phase-legacy-arrived", "到达事件", 4, `return async (context, gameProcess) => {
	await gameProcess.handleArriveEvent(context.currentRoundPlayer);
};`),
			phase("phase-legacy-player-end", "玩家回合结束", 5, "return async (context, gameProcess) => {};"),
		],
		gameRoundEnd: [phase("phase-legacy-round-end", "轮次结束", 6, `return async (context, gameProcess) => {
	gameProcess.currentRound += 1;
};`)],
	};
}

function phase(id: string, name: string, mark: number | undefined, initEventCode: string) {
	return {
		id,
		name,
		description: name,
		from: "AI live legacy import",
		...(mark === undefined ? {} : { mark }),
		initEventCode,
	};
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack ?? error.message : error);
	process.exitCode = 1;
});
