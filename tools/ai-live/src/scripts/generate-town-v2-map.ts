import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { GameMap as ProtoGameMap } from "../../../../packages/utils/protos/game-map.js";

type ProtoFileType = {
	id: string;
	name: string;
	filetype: string;
	buffer: Uint8Array;
};

type QueryValue = string | number | null | boolean;
type TileUsage = {
	items: number;
	properties: number;
	events: number;
};
type GltfPart = {
	kind?: "box" | "roof";
	name: string;
	color: string;
	width: number;
	height: number;
	depth: number;
	x?: number;
	y?: number;
	z?: number;
	roughness?: number;
	metallic?: number;
	doubleSided?: boolean;
	userDataName?: string;
};
type Geometry = {
	positions: number[];
	normals: number[];
	indices: number[];
	min: [number, number, number];
	max: [number, number, number];
};
type Vec3 = [number, number, number];

const COVER_IMAGE_ID = "town-v2-cover";
const BG_IMAGE_ID = "town-v2-background";
const EVENT_IMAGE_ID = "town-v2-event";
const CHANCE_IMAGE_ID = "town-v2-chance";
const ROLE_IMAGE_IDS = ["town-role-red", "town-role-blue", "town-role-green", "town-role-gold"];
const BUILDING_MODEL_IDS = ["town-house-lv0", "town-house-lv1", "town-house-lv2"];

async function main() {
	const root = findRepoRoot();
	const args = parseArgs(process.argv.slice(2));
	const sourceMapPath = resolve(
		root,
		args["source-map"] ?? "apps/server/public/ai-live/legacy-town-rich.fpmap",
	);
	const outputDir = resolve(root, args["output-dir"] ?? "apps/server/public/ai-live");
	const outputFileName = args["output-file"] ?? "town-v2.fpmap";
	const outputCoverName = args["cover-file"] ?? "town-v2-cover.svg";
	const outputMapPath = resolve(outputDir, outputFileName);
	const outputCoverPath = resolve(outputDir, outputCoverName);
	const newMapId = args["new-map-id"] ?? "town-v2-map";
	const serverUrl = (args["server-url"] ?? "http://localhost:8181").replace(/\/$/, "");
	const dbContainer = args["db-container"] ?? "fatpaper-mysql";
	const shouldSeed = !Object.hasOwn(args, "no-seed");

	if (!existsSync(sourceMapPath)) {
		if (!existsSync(outputMapPath)) {
			throw new Error(`source map not found: ${sourceMapPath}. Run import:legacy-map first or keep ${outputMapPath} in the repo.`);
		}
		const existing = await loadFromProto(new Uint8Array(readFileSync(outputMapPath)));
		const existingMap = JSON.parse(existing.jsonData);
		const cover = existing.imageFiles.find((file) => file.id === existingMap.info?.coverImageId);
		if (cover && !existsSync(outputCoverPath)) {
			mkdirSync(dirname(outputCoverPath), { recursive: true });
			writeFileSync(outputCoverPath, Buffer.from(cover.buffer));
		}
		const hash = createHash("sha256").update(readFileSync(outputMapPath)).digest("hex");
		if (shouldSeed) {
			seedGameMap({
				container: dbContainer,
				id: existingMap.id ?? newMapId,
				name: existingMap.info?.name ?? newMapId,
				author: existingMap.info?.author ?? "AI live map generator",
				version: existingMap.info?.version ?? "2.0.0",
				description: existingMap.info?.description ?? "Generated town V2 map.",
				coverUrl: `${serverUrl}/static/ai-live/${outputCoverName}`,
				mapUrl: `${serverUrl}/static/ai-live/${outputFileName}`,
				hash,
			});
		}
		console.log(JSON.stringify({
			sourceMapPath,
			outputMapPath,
			outputCoverPath,
			newMapId: existingMap.id ?? newMapId,
			seeded: shouldSeed,
			dbContainer,
			hash,
			reusedExistingOutput: true,
		}, null, 2));
		return;
	}

	const source = await loadFromProto(new Uint8Array(readFileSync(sourceMapPath)));
	const gameMap = JSON.parse(source.jsonData);
	const mapName = args["map-name"] ?? `${gameMap.info?.name ?? "Town"} V2`;
	const tileModelIds = new Map<string, string>();

	for (const itemType of gameMap.mapItemTypes ?? []) {
		const modelId = tileModelId(itemType.id);
		tileModelIds.set(itemType.id, modelId);
		itemType.modelId = modelId;
	}

	for (const mapItem of gameMap.mapItems ?? []) {
		const itemTypeId = mapItem.type?.id;
		const modelId = itemTypeId ? (tileModelIds.get(itemTypeId) ?? tileModelId(itemTypeId)) : tileModelId("tile");
		if (mapItem.type) mapItem.type.modelId = modelId;
		if (mapItem.property) {
			mapItem.property.buildingModelIdList = [...BUILDING_MODEL_IDS];
		}
	}

	gameMap.id = newMapId;
	gameMap.info = {
		...(gameMap.info ?? {}),
		name: mapName,
		author: "AI live map generator",
		version: "2.0.0",
		editorVersion: gameMap.info?.editorVersion ?? "1.1.4",
		description: `Generated from the legacy town layout with embedded V2 visual resources.`,
		backgroundImageId: BG_IMAGE_ID,
		coverImageId: COVER_IMAGE_ID,
	};
	gameMap.roles = createRoles();
	gameMap.buildingModelIdList = [...BUILDING_MODEL_IDS];
	for (const mapEvent of gameMap.mapEvents ?? []) mapEvent.iconId = EVENT_IMAGE_ID;
	for (const chanceCard of gameMap.chanceCards ?? []) chanceCard.iconId = CHANCE_IMAGE_ID;

	const resources = createGeneratedResources(gameMap);
	const buffer = dataToProtoBuffer(newMapId, JSON.stringify(gameMap), resources.modelFiles, resources.imageFiles);
	const hash = createHash("sha256").update(Buffer.from(buffer)).digest("hex");

	mkdirSync(dirname(outputMapPath), { recursive: true });
	writeFileSync(outputMapPath, Buffer.from(buffer));
	writeFileSync(outputCoverPath, Buffer.from(resources.coverSvg));

	if (shouldSeed) {
		seedGameMap({
			container: dbContainer,
			id: newMapId,
			name: mapName,
			author: "AI live map generator",
			version: "2.0.0",
			description: "Generated from legacy town layout with embedded V2 visual resources.",
			coverUrl: `${serverUrl}/static/ai-live/${outputCoverName}`,
			mapUrl: `${serverUrl}/static/ai-live/${outputFileName}`,
			hash,
		});
	}

	console.log(JSON.stringify({
		sourceMapPath,
		outputMapPath,
		outputCoverPath,
		newMapId,
		seeded: shouldSeed,
		dbContainer,
		hash,
		counts: {
			mapItems: gameMap.mapItems?.length ?? 0,
			mapIndex: gameMap.mapIndex?.length ?? 0,
			mapItemTypes: gameMap.mapItemTypes?.length ?? 0,
			mapEvents: gameMap.mapEvents?.length ?? 0,
			chanceCards: gameMap.chanceCards?.length ?? 0,
			modelFiles: resources.modelFiles.length,
			imageFiles: resources.imageFiles.length,
		},
	}, null, 2));
}

function seedGameMap(options: {
	container: string;
	id: string;
	name: string;
	author: string;
	version: string;
	description: string;
	coverUrl: string;
	mapUrl: string;
	hash: string;
}) {
	runMysql(
		options.container,
		`INSERT INTO game_map (id, name, author, version, description, coverUrl, mapUrl, hash, inuse)
		VALUES (
			${sqlString(options.id)},
			${sqlString(options.name)},
			${sqlString(options.author)},
			${sqlString(options.version)},
			${sqlString(options.description)},
			${sqlString(options.coverUrl)},
			${sqlString(options.mapUrl)},
			${sqlString(options.hash)},
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
			inuse = VALUES(inuse);`,
	);
}

function createGeneratedResources(gameMap: any) {
	const modelFiles: ProtoFileType[] = [];
	const imageFiles: ProtoFileType[] = [];
	const seenModelIds = new Set<string>();
	const tileUsage = summarizeTileUsage(gameMap);
	for (const itemType of gameMap.mapItemTypes ?? []) {
		const modelId = itemType.modelId ?? tileModelId(itemType.id);
		if (seenModelIds.has(modelId)) continue;
		seenModelIds.add(modelId);
		modelFiles.push({
			id: modelId,
			name: `${itemType.name ?? "Tile"} tile`,
			filetype: "gltf",
			buffer: utf8(createTownTileGltf({
				id: itemType.id,
				name: itemType.name ?? "Town tile",
				color: normalizeHexColor(itemType.color, "#6b8fb3"),
				modelId,
				usage: tileUsage.get(itemType.id) ?? { items: 0, properties: 0, events: 0 },
			})),
		});
	}

	[
		{ id: BUILDING_MODEL_IDS[0], level: 0 },
		{ id: BUILDING_MODEL_IDS[1], level: 1 },
		{ id: BUILDING_MODEL_IDS[2], level: 2 },
	].forEach((item) => {
		modelFiles.push({
			id: item.id,
			name: item.id,
			filetype: "gltf",
			buffer: utf8(createTownBuildingGltf(item.id, item.level)),
		});
	});

	const coverSvg = createCoverSvg(gameMap.info?.name ?? "Town V2", gameMap);
	imageFiles.push(
		image(COVER_IMAGE_ID, "Town V2 cover", coverSvg),
		image(BG_IMAGE_ID, "Town V2 background", createBackgroundSvg()),
		image(EVENT_IMAGE_ID, "Town V2 event", createIconSvg("#4d7cfe", "?")),
		image(CHANCE_IMAGE_ID, "Town V2 chance", createIconSvg("#f59f00", "!")),
		image(ROLE_IMAGE_IDS[0], "Red Mimo", createRoleSvg("#e1495b", "1")),
		image(ROLE_IMAGE_IDS[1], "Blue Mimo", createRoleSvg("#2563eb", "2")),
		image(ROLE_IMAGE_IDS[2], "Green Mimo", createRoleSvg("#0f9f6e", "3")),
		image(ROLE_IMAGE_IDS[3], "Gold Mimo", createRoleSvg("#c28a13", "4")),
	);

	return { modelFiles, imageFiles, coverSvg };
}

function createRoles() {
	const names = ["Red Mimo", "Blue Mimo", "Green Mimo", "Gold Mimo"];
	const colors = ["#e1495b", "#2563eb", "#0f9f6e", "#c28a13"];
	return names.map((name, index) => ({
		id: `role-${["red", "blue", "green", "gold"][index]}`,
		name,
		description: "AI live player",
		color: colors[index],
		imageId: ROLE_IMAGE_IDS[index],
		initCode: "return (player, gameProcess) => {};",
	}));
}

function summarizeTileUsage(gameMap: any) {
	const usage = new Map<string, TileUsage>();
	for (const mapItem of gameMap.mapItems ?? []) {
		const typeId = mapItem.type?.id;
		if (!typeId) continue;
		const entry = usage.get(typeId) ?? { items: 0, properties: 0, events: 0 };
		entry.items += 1;
		if (mapItem.property) entry.properties += 1;
		if (mapItem.mapEventId) entry.events += 1;
		usage.set(typeId, entry);
	}
	return usage;
}

function createTownTileGltf(options: {
	id: string;
	name: string;
	color: string;
	modelId: string;
	usage: TileUsage;
}) {
	const kind = classifyTownTile(options.name, options.color, options.usage);
	const color = normalizeHexColor(options.color, "#6b8fb3");
	const accent = brightenColor(color, 0.22);
	const shadow = darkenColor(color, 0.2);
	const parts: GltfPart[] = [];

	if (kind === "property") {
		parts.push(
			{ name: "grass-lot", color: "#79b86d", width: 0.98, height: 0.075, depth: 0.98 },
			{ name: "stone-foundation", color: "#d8c59f", width: 0.58, height: 0.035, depth: 0.58, y: 0.075 },
			{ name: "front-path", color: "#eadab9", width: 0.18, height: 0.035, depth: 0.42, y: 0.078, z: 0.2 },
			{ name: "north-curb", color: "#ece5d6", width: 0.98, height: 0.035, depth: 0.07, y: 0.08, z: -0.455 },
			{ name: "south-curb", color: "#ece5d6", width: 0.98, height: 0.035, depth: 0.07, y: 0.08, z: 0.455 },
			{ name: "lot-marker-a", color: accent, width: 0.12, height: 0.045, depth: 0.12, x: -0.35, y: 0.08, z: -0.35 },
			{ name: "lot-marker-b", color: shadow, width: 0.12, height: 0.045, depth: 0.12, x: 0.35, y: 0.08, z: 0.35 },
		);
	} else if (kind === "road") {
		parts.push(
			{ name: "asphalt", color: "#596267", width: 0.98, height: 0.075, depth: 0.98 },
			{ name: "sidewalk-left", color: "#c9c1ad", width: 0.16, height: 0.035, depth: 0.98, x: -0.41, y: 0.075 },
			{ name: "sidewalk-right", color: "#c9c1ad", width: 0.16, height: 0.035, depth: 0.98, x: 0.41, y: 0.075 },
			{ name: "lane-stripe-a", color: "#f3d05c", width: 0.055, height: 0.025, depth: 0.22, y: 0.095, z: -0.22 },
			{ name: "lane-stripe-b", color: "#f3d05c", width: 0.055, height: 0.025, depth: 0.22, y: 0.095, z: 0.22 },
		);
	} else if (kind === "station") {
		parts.push(
			{ name: "stone-plaza", color: "#777f87", width: 0.98, height: 0.075, depth: 0.98 },
			{ name: "event-pad", color: "#f2b84b", width: 0.52, height: 0.055, depth: 0.52, y: 0.075 },
			{ name: "event-inset", color: "#fff3bf", width: 0.32, height: 0.03, depth: 0.32, y: 0.13 },
			{ name: "sign-post", color: "#614a35", width: 0.06, height: 0.32, depth: 0.06, x: -0.34, y: 0.075, z: -0.28 },
			{ name: "sign-board", color: "#4d7cfe", width: 0.32, height: 0.18, depth: 0.055, x: -0.34, y: 0.34, z: -0.28 },
		);
	} else if (kind === "water") {
		parts.push(
			{ name: "water-base", color: "#2f95d0", width: 0.98, height: 0.065, depth: 0.98, roughness: 0.42 },
			{ name: "shore-a", color: "#e3d7b3", width: 0.98, height: 0.03, depth: 0.09, y: 0.065, z: -0.445 },
			{ name: "shore-b", color: "#e3d7b3", width: 0.98, height: 0.03, depth: 0.09, y: 0.065, z: 0.445 },
			{ name: "wave-a", color: "#c9f2ff", width: 0.55, height: 0.02, depth: 0.045, x: -0.12, y: 0.085, z: -0.16 },
			{ name: "wave-b", color: "#c9f2ff", width: 0.42, height: 0.02, depth: 0.045, x: 0.18, y: 0.087, z: 0.14 },
		);
	} else if (kind === "park") {
		parts.push(
			{ name: "park-grass", color: "#63b96d", width: 0.98, height: 0.07, depth: 0.98 },
			{ name: "garden-path", color: "#d7c49b", width: 0.22, height: 0.035, depth: 0.98, y: 0.07 },
			{ name: "tree-trunk-a", color: "#7a5332", width: 0.07, height: 0.22, depth: 0.07, x: -0.26, y: 0.07, z: -0.22 },
			{ name: "tree-crown-a", color: "#2f9e44", width: 0.26, height: 0.18, depth: 0.26, x: -0.26, y: 0.29, z: -0.22 },
			{ name: "tree-trunk-b", color: "#7a5332", width: 0.06, height: 0.18, depth: 0.06, x: 0.29, y: 0.07, z: 0.25 },
			{ name: "tree-crown-b", color: "#55bd68", width: 0.22, height: 0.15, depth: 0.22, x: 0.29, y: 0.25, z: 0.25 },
			{ name: "flower-bed", color: accent, width: 0.34, height: 0.04, depth: 0.12, x: 0.16, y: 0.07, z: -0.32 },
		);
	} else if (kind === "market") {
		parts.push(
			{ name: "market-pavers", color: "#c9b5ce", width: 0.98, height: 0.07, depth: 0.98 },
			{ name: "stall-counter", color: "#8b5e3c", width: 0.46, height: 0.18, depth: 0.24, y: 0.07 },
			{ name: "stall-awning", kind: "roof", color: accent, width: 0.58, height: 0.18, depth: 0.34, y: 0.25, doubleSided: true },
			{ name: "crate-a", color: "#d79043", width: 0.16, height: 0.12, depth: 0.16, x: -0.31, y: 0.07, z: 0.28 },
			{ name: "crate-b", color: "#77b255", width: 0.16, height: 0.12, depth: 0.16, x: 0.32, y: 0.07, z: -0.26 },
		);
	} else {
		parts.push(
			{ name: "town-pavers", color: "#d8d1bf", width: 0.98, height: 0.07, depth: 0.98 },
			{ name: "accent-corner-a", color: accent, width: 0.22, height: 0.045, depth: 0.22, x: -0.3, y: 0.07, z: -0.3 },
			{ name: "accent-corner-b", color: shadow, width: 0.22, height: 0.045, depth: 0.22, x: 0.3, y: 0.07, z: 0.3 },
			{ name: "fountain-base", color: "#8aa6b4", width: 0.34, height: 0.08, depth: 0.34, y: 0.07 },
			{ name: "fountain-water", color: "#79cdf2", width: 0.22, height: 0.04, depth: 0.22, y: 0.15 },
		);
	}

	return createCompositeGltf(options.modelId, parts);
}

function classifyTownTile(name: string, color: string, usage: TileUsage) {
	const lowerName = name.toLowerCase();
	const [r, g, b] = hexToRgb255(color);
	if (usage.properties > 0) return "property";
	if (usage.items > 0 && usage.events / usage.items > 0.45) return "station";
	if (lowerName.includes("道路")) return "road";
	if (lowerName.includes("village")) return "park";
	if (b > r + 28 && b > g + 12) return "water";
	if (g > r + 24 && g > b + 8) return "park";
	if (r > 130 && b > 120) return "market";
	if (r > 130 && g > 75) return "plaza";
	return "plaza";
}

function createTownBuildingGltf(id: string, level: number) {
	const parts: GltfPart[] = [];
	if (level === 0) {
		parts.push(
			{ name: "cottage-foundation", color: "#b8aa91", width: 0.46, height: 0.08, depth: 0.42 },
			{ name: "cottage-wall", color: "#f0e4ce", width: 0.38, height: 0.34, depth: 0.34, y: 0.08, userDataName: "owner-color-wall" },
			{ name: "cottage-roof", kind: "roof", color: "#b94b42", width: 0.5, height: 0.24, depth: 0.46, y: 0.42, doubleSided: true },
			{ name: "cottage-door", color: "#6d4c36", width: 0.09, height: 0.17, depth: 0.025, y: 0.09, z: 0.183 },
			{ name: "cottage-window-left", color: "#8fd4ff", width: 0.08, height: 0.075, depth: 0.022, x: -0.1, y: 0.25, z: 0.184 },
			{ name: "cottage-window-right", color: "#8fd4ff", width: 0.08, height: 0.075, depth: 0.022, x: 0.1, y: 0.25, z: 0.184 },
		);
	} else if (level === 1) {
		parts.push(
			{ name: "shop-foundation", color: "#a99b83", width: 0.56, height: 0.08, depth: 0.5 },
			{ name: "shop-floor-one", color: "#e8ddc8", width: 0.46, height: 0.34, depth: 0.4, y: 0.08, userDataName: "owner-color-floor-one" },
			{ name: "shop-floor-two", color: "#f4ead7", width: 0.42, height: 0.3, depth: 0.36, y: 0.42, userDataName: "owner-color-floor-two" },
			{ name: "shop-roof", kind: "roof", color: "#375a7f", width: 0.56, height: 0.23, depth: 0.46, y: 0.72, doubleSided: true },
			{ name: "shop-awning", kind: "roof", color: "#ef9f3a", width: 0.38, height: 0.12, depth: 0.16, y: 0.32, z: 0.27, doubleSided: true },
			{ name: "shop-door", color: "#70513b", width: 0.1, height: 0.2, depth: 0.025, y: 0.09, z: 0.214 },
			{ name: "shop-window-a", color: "#9bd7ff", width: 0.09, height: 0.085, depth: 0.022, x: -0.14, y: 0.22, z: 0.215 },
			{ name: "shop-window-b", color: "#9bd7ff", width: 0.09, height: 0.085, depth: 0.022, x: 0.14, y: 0.22, z: 0.215 },
			{ name: "shop-window-c", color: "#9bd7ff", width: 0.09, height: 0.085, depth: 0.022, x: -0.1, y: 0.54, z: 0.194 },
			{ name: "shop-window-d", color: "#9bd7ff", width: 0.09, height: 0.085, depth: 0.022, x: 0.1, y: 0.54, z: 0.194 },
		);
	} else {
		parts.push(
			{ name: "tower-foundation", color: "#9d927f", width: 0.66, height: 0.08, depth: 0.56 },
			{ name: "tower-left-wing", color: "#dfd4c0", width: 0.22, height: 0.48, depth: 0.42, x: -0.22, y: 0.08, userDataName: "owner-color-left-wing" },
			{ name: "tower-right-wing", color: "#dfd4c0", width: 0.22, height: 0.48, depth: 0.42, x: 0.22, y: 0.08, userDataName: "owner-color-right-wing" },
			{ name: "tower-center", color: "#f0e5d1", width: 0.3, height: 0.82, depth: 0.42, y: 0.08, userDataName: "owner-color-center" },
			{ name: "tower-roof-main", kind: "roof", color: "#7b3946", width: 0.74, height: 0.24, depth: 0.62, y: 0.56, doubleSided: true },
			{ name: "tower-roof-top", kind: "roof", color: "#5f2d3a", width: 0.4, height: 0.22, depth: 0.46, y: 0.9, doubleSided: true },
			{ name: "tower-door", color: "#624832", width: 0.11, height: 0.22, depth: 0.025, y: 0.09, z: 0.224 },
			{ name: "tower-window-a", color: "#9bd7ff", width: 0.08, height: 0.085, depth: 0.022, x: -0.22, y: 0.25, z: 0.214 },
			{ name: "tower-window-b", color: "#9bd7ff", width: 0.08, height: 0.085, depth: 0.022, x: 0.22, y: 0.25, z: 0.214 },
			{ name: "tower-window-c", color: "#9bd7ff", width: 0.08, height: 0.085, depth: 0.022, x: -0.08, y: 0.48, z: 0.214 },
			{ name: "tower-window-d", color: "#9bd7ff", width: 0.08, height: 0.085, depth: 0.022, x: 0.08, y: 0.48, z: 0.214 },
			{ name: "tower-window-e", color: "#9bd7ff", width: 0.08, height: 0.085, depth: 0.022, x: -0.08, y: 0.7, z: 0.214 },
			{ name: "tower-window-f", color: "#9bd7ff", width: 0.08, height: 0.085, depth: 0.022, x: 0.08, y: 0.7, z: 0.214 },
		);
	}
	return createCompositeGltf(id, parts);
}

function createCompositeGltf(name: string, parts: GltfPart[]) {
	const chunks: Buffer[] = [];
	const bufferViews: any[] = [];
	const accessors: any[] = [];
	const meshes: any[] = [];
	const nodes: any[] = [];
	const materials: any[] = [];
	const materialIndexByKey = new Map<string, number>();
	let byteLength = 0;

	const appendBuffer = (buffer: Buffer, alignment: number) => {
		const padLength = (alignment - (byteLength % alignment)) % alignment;
		if (padLength) {
			chunks.push(Buffer.alloc(padLength));
			byteLength += padLength;
		}
		const byteOffset = byteLength;
		chunks.push(buffer);
		byteLength += buffer.length;
		return byteOffset;
	};

	const getMaterialIndex = (part: GltfPart) => {
		const color = normalizeHexColor(part.color, "#6b8fb3");
		const roughness = part.roughness ?? 0.84;
		const metallic = part.metallic ?? 0;
		const key = `${color}:${roughness}:${metallic}:${part.doubleSided ? "double" : "single"}`;
		const existing = materialIndexByKey.get(key);
		if (existing !== undefined) return existing;
		const [r, g, b] = hexToRgb01(color);
		const material: any = {
			name: `${name}-${materials.length}`,
			pbrMetallicRoughness: {
				baseColorFactor: [r, g, b, 1],
				metallicFactor: metallic,
				roughnessFactor: roughness,
			},
		};
		if (part.doubleSided) material.doubleSided = true;
		const index = materials.length;
		materials.push(material);
		materialIndexByKey.set(key, index);
		return index;
	};

	parts.forEach((part) => {
		const geometry = part.kind === "roof" ? createRoofGeometry(part) : createBoxGeometry(part);
		const positionBytes = float32Bytes(geometry.positions);
		const normalBytes = float32Bytes(geometry.normals);
		const indexBytes = uint16Bytes(geometry.indices);

		const positionView = bufferViews.length;
		bufferViews.push({ buffer: 0, byteOffset: appendBuffer(positionBytes, 4), byteLength: positionBytes.length, target: 34962 });
		const normalView = bufferViews.length;
		bufferViews.push({ buffer: 0, byteOffset: appendBuffer(normalBytes, 4), byteLength: normalBytes.length, target: 34962 });
		const indexView = bufferViews.length;
		bufferViews.push({ buffer: 0, byteOffset: appendBuffer(indexBytes, 2), byteLength: indexBytes.length, target: 34963 });

		const positionAccessor = accessors.length;
		accessors.push({
			bufferView: positionView,
			componentType: 5126,
			count: geometry.positions.length / 3,
			type: "VEC3",
			min: geometry.min,
			max: geometry.max,
		});
		const normalAccessor = accessors.length;
		accessors.push({
			bufferView: normalView,
			componentType: 5126,
			count: geometry.normals.length / 3,
			type: "VEC3",
		});
		const indexAccessor = accessors.length;
		accessors.push({
			bufferView: indexView,
			componentType: 5123,
			count: geometry.indices.length,
			type: "SCALAR",
			min: [0],
			max: [geometry.positions.length / 3 - 1],
		});

		const meshIndex = meshes.length;
		meshes.push({
			name: part.name,
			primitives: [{
				attributes: { POSITION: positionAccessor, NORMAL: normalAccessor },
				indices: indexAccessor,
				material: getMaterialIndex(part),
			}],
		});
		const node: any = { name: part.name, mesh: meshIndex };
		if (part.userDataName) node.extras = { name: part.userDataName };
		nodes.push(node);
	});

	const buffer = Buffer.concat(chunks);
	return JSON.stringify({
		asset: { version: "2.0", generator: "ai-live town-v2 generator" },
		scene: 0,
		scenes: [{ nodes: nodes.map((_, index) => index) }],
		nodes,
		meshes,
		materials,
		buffers: [{ uri: `data:application/octet-stream;base64,${buffer.toString("base64")}`, byteLength: buffer.length }],
		bufferViews,
		accessors,
	});
}

function createBoxGeometry(part: GltfPart): Geometry {
	const x = part.x ?? 0;
	const y = part.y ?? 0;
	const z = part.z ?? 0;
	const w = part.width / 2;
	const h = part.height;
	const d = part.depth / 2;
	const minX = x - w;
	const maxX = x + w;
	const minY = y;
	const maxY = y + h;
	const minZ = z - d;
	const maxZ = z + d;
	const positions = [
		minX, minY, maxZ, maxX, minY, maxZ, maxX, maxY, maxZ, minX, maxY, maxZ,
		maxX, minY, minZ, minX, minY, minZ, minX, maxY, minZ, maxX, maxY, minZ,
		minX, maxY, maxZ, maxX, maxY, maxZ, maxX, maxY, minZ, minX, maxY, minZ,
		minX, minY, minZ, maxX, minY, minZ, maxX, minY, maxZ, minX, minY, maxZ,
		maxX, minY, maxZ, maxX, minY, minZ, maxX, maxY, minZ, maxX, maxY, maxZ,
		minX, minY, minZ, minX, minY, maxZ, minX, maxY, maxZ, minX, maxY, minZ,
	];
	const normals = [
		0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
		0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
		0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
		0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
		-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
	];
	const indices = [
		0, 1, 2, 0, 2, 3,
		4, 5, 6, 4, 6, 7,
		8, 9, 10, 8, 10, 11,
		12, 13, 14, 12, 14, 15,
		16, 17, 18, 16, 18, 19,
		20, 21, 22, 20, 22, 23,
	];
	return { positions, normals, indices, min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

function createRoofGeometry(part: GltfPart): Geometry {
	const x = part.x ?? 0;
	const y = part.y ?? 0;
	const z = part.z ?? 0;
	const w = part.width / 2;
	const h = part.height;
	const depth = part.depth / 2;
	const a: Vec3 = [x - w, y, z + depth];
	const b: Vec3 = [x + w, y, z + depth];
	const c: Vec3 = [x, y + h, z + depth];
	const d: Vec3 = [x - w, y, z - depth];
	const e: Vec3 = [x + w, y, z - depth];
	const f: Vec3 = [x, y + h, z - depth];
	const positions: number[] = [];
	const normals: number[] = [];
	const indices: number[] = [];

	pushFace(a, b, c);
	pushFace(d, f, e);
	pushFace(d, a, c, f);
	pushFace(b, e, f, c);
	pushFace(d, e, b, a);

	return {
		positions,
		normals,
		indices,
		min: [x - w, y, z - depth],
		max: [x + w, y + h, z + depth],
	};

	function pushFace(...vertices: Vec3[]) {
		const normal = faceNormal(vertices[0], vertices[1], vertices[2]);
		const start = positions.length / 3;
		for (const vertex of vertices) {
			positions.push(vertex[0], vertex[1], vertex[2]);
			normals.push(normal[0], normal[1], normal[2]);
		}
		for (let index = 1; index < vertices.length - 1; index += 1) {
			indices.push(start, start + index, start + index + 1);
		}
	}
}

function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
	const ux = b[0] - a[0];
	const uy = b[1] - a[1];
	const uz = b[2] - a[2];
	const vx = c[0] - a[0];
	const vy = c[1] - a[1];
	const vz = c[2] - a[2];
	const nx = uy * vz - uz * vy;
	const ny = uz * vx - ux * vz;
	const nz = ux * vy - uy * vx;
	const length = Math.hypot(nx, ny, nz) || 1;
	return [nx / length, ny / length, nz / length];
}

function createBoxGltf(options: { name: string; color: string; width: number; height: number; depth: number }) {
	const w = options.width / 2;
	const h = options.height;
	const d = options.depth / 2;
	const positions = [
		-w, 0, d, w, 0, d, w, h, d, -w, h, d,
		w, 0, -d, -w, 0, -d, -w, h, -d, w, h, -d,
		-w, h, d, w, h, d, w, h, -d, -w, h, -d,
		-w, 0, -d, w, 0, -d, w, 0, d, -w, 0, d,
		w, 0, d, w, 0, -d, w, h, -d, w, h, d,
		-w, 0, -d, -w, 0, d, -w, h, d, -w, h, -d,
	];
	const normals = [
		0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
		0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
		0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
		0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
		1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
		-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
	];
	const indices = [
		0, 1, 2, 0, 2, 3,
		4, 5, 6, 4, 6, 7,
		8, 9, 10, 8, 10, 11,
		12, 13, 14, 12, 14, 15,
		16, 17, 18, 16, 18, 19,
		20, 21, 22, 20, 22, 23,
	];
	const positionBytes = float32Bytes(positions);
	const normalBytes = float32Bytes(normals);
	const indexBytes = uint16Bytes(indices);
	const buffer = Buffer.concat([positionBytes, normalBytes, indexBytes]);
	const [r, g, b] = hexToRgb01(options.color);
	return JSON.stringify({
		asset: { version: "2.0", generator: "ai-live town-v2 generator" },
		scene: 0,
		scenes: [{ nodes: [0] }],
		nodes: [{ name: options.name, mesh: 0 }],
		meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
		materials: [{
			name: `${options.name}-material`,
			pbrMetallicRoughness: {
				baseColorFactor: [r, g, b, 1],
				metallicFactor: 0,
				roughnessFactor: 0.82,
			},
		}],
		buffers: [{ uri: `data:application/octet-stream;base64,${buffer.toString("base64")}`, byteLength: buffer.length }],
		bufferViews: [
			{ buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
			{ buffer: 0, byteOffset: positionBytes.length, byteLength: normalBytes.length, target: 34962 },
			{ buffer: 0, byteOffset: positionBytes.length + normalBytes.length, byteLength: indexBytes.length, target: 34963 },
		],
		accessors: [
			{ bufferView: 0, componentType: 5126, count: 24, type: "VEC3", min: [-w, 0, -d], max: [w, h, d] },
			{ bufferView: 1, componentType: 5126, count: 24, type: "VEC3" },
			{ bufferView: 2, componentType: 5123, count: indices.length, type: "SCALAR", min: [0], max: [23] },
		],
	});
}

function createCoverSvg(name: string, gameMap: any) {
	const propertyCount = (gameMap.mapItems ?? []).filter((item: any) => item.property).length;
	const eventCount = gameMap.mapEvents?.length ?? 0;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f5ff"/><stop offset="1" stop-color="#d9f7e8"/></linearGradient>
<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#31556d" flood-opacity=".25"/></filter>
</defs>
<rect width="960" height="540" fill="url(#sky)"/>
<rect x="70" y="72" width="820" height="396" rx="30" fill="#fffaf0" stroke="#274c77" stroke-width="10" filter="url(#shadow)"/>
<path d="M148 368H812M148 272H812M148 176H812M244 104V436M364 104V436M484 104V436M604 104V436M724 104V436" stroke="#d3b36a" stroke-width="10" stroke-linecap="round" opacity=".85"/>
<g fill="#2f80ed"><rect x="142" y="136" width="92" height="72" rx="16"/><rect x="262" y="232" width="92" height="72" rx="16"/><rect x="622" y="328" width="92" height="72" rx="16"/></g>
<g fill="#0f9f6e"><rect x="382" y="136" width="92" height="72" rx="16"/><rect x="742" y="232" width="92" height="72" rx="16"/></g>
<g fill="#f59f00"><circle cx="244" cy="368" r="36"/><circle cx="604" cy="176" r="36"/></g>
<text x="480" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#14324a">${escapeXml(name)}</text>
<text x="480" y="502" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#274c77">${propertyCount} properties / ${eventCount} events / embedded V2 resources</text>
</svg>`;
}

function createBackgroundSvg() {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eff8ff"/><stop offset=".55" stop-color="#eefbf1"/><stop offset="1" stop-color="#fff3d6"/></linearGradient></defs>
<rect width="1024" height="1024" fill="url(#g)"/>
<g fill="none" stroke="#9fb7c7" stroke-width="3" opacity=".3">
<path d="M110 165c180-80 330-40 480 40s260 75 340 10"/>
<path d="M80 760c170-75 345-62 510 2s270 62 365-18"/>
</g>
</svg>`;
}

function createIconSvg(color: string, label: string) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
<circle cx="64" cy="64" r="55" fill="${color}"/>
<circle cx="64" cy="64" r="43" fill="#fff" opacity=".16"/>
<text x="64" y="82" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#fff">${escapeXml(label)}</text>
</svg>`;
}

function createRoleSvg(color: string, label: string) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 220">
<ellipse cx="80" cy="196" rx="42" ry="14" fill="#000" opacity=".2"/>
<circle cx="80" cy="58" r="42" fill="${color}"/>
<rect x="38" y="94" width="84" height="86" rx="30" fill="${color}"/>
<circle cx="64" cy="52" r="6" fill="#fff"/>
<circle cx="96" cy="52" r="6" fill="#fff"/>
<path d="M62 74c14 10 24 10 38 0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
<text x="80" y="151" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#fff">${escapeXml(label)}</text>
</svg>`;
}

function image(id: string, name: string, svg: string): ProtoFileType {
	return { id, name, filetype: "svg+xml", buffer: utf8(svg) };
}

function tileModelId(typeId: string) {
	return `town-tile-${sanitizeId(typeId)}`;
}

function sanitizeId(value: string) {
	return value.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "item";
}

function normalizeHexColor(value: string | undefined, fallback: string) {
	if (!value) return fallback;
	const raw = value.trim().replace(/^#/, "");
	if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`;
	if (/^[0-9a-f]{3}$/i.test(raw)) {
		return `#${raw.split("").map((char) => char + char).join("").toLowerCase()}`;
	}
	if (/^[0-9a-f]{1,5}$/i.test(raw)) return `#${raw.padStart(6, "0").toLowerCase()}`;
	return fallback;
}

function hexToRgb01(hex: string) {
	const value = normalizeHexColor(hex, "#6b8fb3").slice(1);
	return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
}

function hexToRgb255(hex: string): [number, number, number] {
	const value = normalizeHexColor(hex, "#6b8fb3").slice(1);
	return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number];
}

function brightenColor(hex: string, amount: number) {
	const [r, g, b] = hexToRgb255(hex);
	return rgbToHex(
		Math.round(r + (255 - r) * amount),
		Math.round(g + (255 - g) * amount),
		Math.round(b + (255 - b) * amount),
	);
}

function darkenColor(hex: string, amount: number) {
	const [r, g, b] = hexToRgb255(hex);
	return rgbToHex(
		Math.round(r * (1 - amount)),
		Math.round(g * (1 - amount)),
		Math.round(b * (1 - amount)),
	);
}

function rgbToHex(r: number, g: number, b: number) {
	return `#${[r, g, b].map((value) => clampColor(value).toString(16).padStart(2, "0")).join("")}`;
}

function clampColor(value: number) {
	return Math.max(0, Math.min(255, value));
}

function float32Bytes(values: number[]) {
	const buffer = Buffer.alloc(values.length * 4);
	values.forEach((value, index) => buffer.writeFloatLE(value, index * 4));
	return buffer;
}

function uint16Bytes(values: number[]) {
	const buffer = Buffer.alloc(values.length * 2);
	values.forEach((value, index) => buffer.writeUInt16LE(value, index * 2));
	return buffer;
}

function utf8(value: string) {
	return new Uint8Array(Buffer.from(value, "utf8"));
}

function escapeXml(value: string) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
		{ encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
	);
}

function sqlString(value: QueryValue) {
	if (value === null) return "NULL";
	if (typeof value === "number") return String(value);
	if (typeof value === "boolean") return value ? "1" : "0";
	return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

void main();
