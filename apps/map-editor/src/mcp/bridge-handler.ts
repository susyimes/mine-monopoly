/**
 * MCP Bridge Handler for Renderer Process
 *
 * This file handles MCP tool invocations from the main process
 * and bridges them to the Pinia stores.
 */

import { useMapDataStore, useResourceStore, useEditorStore } from "@src/stores";
import { createDefaultMapData } from "@src/utils/file";
import type { GameMap } from "@mine-monopoly/types";
import { eventBus } from "@src/utils/event-bus";

/**
 * Send MCP operation feedback event
 */
function sendMCPFeedback(operation: string, success: boolean, message: string, details?: any) {
	eventBus.emit("mcp-operation", {
		operation,
		success,
		message,
		details,
	});
}

// Phase type for phases object keys
type PhaseType = "gameOverRule" | "gameInited" | "gameRoundStart" | "playerRound" | "gameRoundEnd";

// Define MCP tool names locally
type MCPToolName =
	// Map info tools
	| "get_map_info"
	| "update_map_info"
	| "get_map_summary"
	// Map item tools
	| "get_map_items"
	| "add_map_item"
	| "remove_map_item"
	| "update_map_item"
	| "link_map_items"
	| "unlink_map_item"
	| "get_map_index"
	| "set_map_index"
	// Map event tools
	| "get_map_events"
	| "add_map_event"
	| "remove_map_event"
	| "link_event_to_item"
	| "unlink_event_from_item"
	// Resource tools
	| "list_models"
	| "list_images"
	| "get_resource_by_id"
	| "add_temp_model"
	| "add_temp_image"
	// Role tools
	| "get_roles"
	| "add_role"
	| "update_role"
	| "remove_role"
	// Chance card tools
	| "get_chance_cards"
	| "add_chance_card"
	| "remove_chance_card"
	// Game phase tools
	| "get_phases"
	| "add_phase"
	| "remove_phase"
	| "update_phase"
	// UI template tools
	| "get_ui_templates"
	| "add_ui_template"
	| "remove_ui_template"
	| "update_ui_template"
	// Custom UI tools
	| "get_custom_uis"
	| "add_custom_ui"
	| "remove_custom_ui"
	| "update_custom_ui"
	// Game setting tools
	| "get_game_setting_form"
	| "update_game_setting_form"
	// Extra libs tools
	| "get_extra_libs"
	| "update_extra_libs"
	// File operation tools
	| "create_new_map"
	| "load_map_file"
	| "save_map_file"
	| "get_current_file_path"
	// Analysis tools
	| "validate_map"
	| "find_duplicates"
	| "analyze_map_layout";

/**
 * Initialize the MCP bridge handler
 * Call this in the main.ts of the renderer process
 */
export function initMCPBridge() {
	// Register the tool handler with the preload script via contextBridge
	console.log("MCP Bridge initialized");

	// Get the mcpAPI from window (exposed by contextBridge)
	const mcpAPI = (window as any).mcpAPI;
	if (mcpAPI && mcpAPI.registerToolHandler) {
		mcpAPI.registerToolHandler(handleToolInvocation);
		console.log("MCP Tool handler registered successfully");
	} else {
		console.error("mcpAPI.registerToolHandler not available!");
	}
}

/**
 * Handle tool invocation by routing to the appropriate store action
 */
export async function handleToolInvocation(toolName: MCPToolName, args: any): Promise<any> {
	const mapDataStore = useMapDataStore();
	const resourceStore = useResourceStore();
	const editorStore = useEditorStore();

	try {
		switch (toolName) {
			// Map Info Tools
			case "get_map_info":
				// Convert reactive object to plain object for IPC
				return JSON.parse(JSON.stringify(mapDataStore.info));

			case "update_map_info":
				mapDataStore.updateMapInfo(args);
				return JSON.parse(JSON.stringify(mapDataStore.info));

			case "get_map_summary":
				return {
					totalItems: mapDataStore.mapItems.length,
					totalEvents: mapDataStore.mapEvents.length,
					totalRoles: mapDataStore.roles.length,
					totalModels: resourceStore.models.length,
					totalImages: resourceStore.images.length,
					mapIndexLength: mapDataStore.mapIndex.length,
				};

			// Map Item Tools
			case "get_map_items": {
				let items = [...mapDataStore.mapItems];

				if (args?.typeId) {
					items = items.filter((item) => item.type.id === args.typeId);
				}
				if (args?.x !== undefined && args?.y !== undefined) {
					if (args?.radius !== undefined) {
						// Filter by radius
						items = items.filter((item) => {
							const dx = item.x - args.x;
							const dy = item.y - args.y;
							return Math.sqrt(dx * dx + dy * dy) <= args.radius;
						});
					} else {
						// Filter by exact coordinates
						items = items.filter((item) => item.x === args.x && item.y === args.y);
					}
				}
				// Convert to plain objects
				return JSON.parse(JSON.stringify(items));
			}

			case "add_map_item": {
				const mapItemType = mapDataStore.mapItemTypes.find((t) => t.id === args.typeId);
				if (!mapItemType) {
					throw new Error(`MapItemType with ID ${args.typeId} not found`);
				}
				const newItem = {
					id: `item-${crypto.randomUUID()}`,
					type: mapItemType,
					x: args.x,
					y: args.y,
					rotation: args.rotation ?? 0,
					mapEventId: args.mapEventId,
				};
				mapDataStore.addMapItem(newItem as any);
				sendMCPFeedback("add_map_item", true, `添加地图项目成功 (${args.x}, ${args.y})`, { id: newItem.id });
				return JSON.parse(JSON.stringify(newItem));
			}

			case "remove_map_item":
				mapDataStore.removeMapItem(args.itemId);
				sendMCPFeedback("remove_map_item", true, `删除地图项目成功`, { id: args.itemId });
				return { success: true };

			case "update_map_item": {
				const item = mapDataStore.findMapItemById(args.itemId);
				if (!item) {
					throw new Error(`MapItem with ID ${args.itemId} not found`);
				}
				const oldX = item.x;
				const oldY = item.y;
				if (args.x !== undefined) item.x = args.x;
				if (args.y !== undefined) item.y = args.y;
				if (args.rotation !== undefined) item.rotation = args.rotation;
				sendMCPFeedback("update_map_item", true, `更新地图项目位置 (${oldX}, ${oldY}) → (${item.x}, ${item.y})`, { id: args.itemId });
				return JSON.parse(JSON.stringify(item));
			}

			case "link_map_items":
				mapDataStore.linkToMapItem(args.sourceId, args.targetId);
				sendMCPFeedback("link_map_items", true, `链接地图项目成功`, { sourceId: args.sourceId, targetId: args.targetId });
				return { success: true };

			case "unlink_map_item":
				mapDataStore.unLinkMapItem(args.itemId);
				sendMCPFeedback("unlink_map_item", true, `取消链接成功`, { id: args.itemId });
				return { success: true };

			case "get_map_index":
				return JSON.parse(JSON.stringify(mapDataStore.mapIndex));

			case "set_map_index":
				mapDataStore.updateMapIndex(args.index);
				sendMCPFeedback("set_map_index", true, `更新地图路径成功 (${args.index.length} 个格子)`, { count: args.index.length });
				return { success: true };

			// Map Event Tools
			case "get_map_events":
				return JSON.parse(JSON.stringify(mapDataStore.mapEvents));

			case "add_map_event": {
				const newEvent = {
					id: `event-${crypto.randomUUID()}`,
					name: args.name,
					type: args.type,
					description: args.description || "",
					iconId: args.iconId,
					effectCode: args.effectCode,
				};
				mapDataStore.addMapEvent(newEvent as any);
				sendMCPFeedback("add_map_event", true, `添加地图事件成功: ${args.name}`, { id: newEvent.id, name: args.name });
				return JSON.parse(JSON.stringify(newEvent));
			}

			case "remove_map_event":
				mapDataStore.reomveMapEvent(args.eventId);
				sendMCPFeedback("remove_map_event", true, `删除地图事件成功`, { id: args.eventId });
				return { success: true };

			case "link_event_to_item":
				mapDataStore.linkMapEvent(args.itemId, args.eventId);
				sendMCPFeedback("link_event_to_item", true, `链接事件到地图项目成功`, { itemId: args.itemId, eventId: args.eventId });
				return { success: true };

			case "unlink_event_from_item":
				mapDataStore.linkMapEvent(args.itemId, undefined);
				sendMCPFeedback("unlink_event_from_item", true, `取消事件链接成功`, { id: args.itemId });
				return { success: true };

			// Resource Tools
			case "list_models":
				return JSON.parse(JSON.stringify(resourceStore.models));

			case "list_images":
				return JSON.parse(JSON.stringify(resourceStore.images));

			case "get_resource_by_id":
				if (args.type === "model") {
					return JSON.parse(JSON.stringify(resourceStore.findModelById(args.resourceId)));
				} else {
					return JSON.parse(JSON.stringify(resourceStore.findImageById(args.resourceId)));
				}

			case "add_temp_model": {
				const newModel = await resourceStore.addTempModel();
				return JSON.parse(JSON.stringify(newModel));
			}

			case "add_temp_image": {
				const newImage = await resourceStore.addTempImage();
				return JSON.parse(JSON.stringify(newImage));
			}

			// Role Tools
			case "get_roles":
				return JSON.parse(JSON.stringify(mapDataStore.roles));

			case "add_role": {
				const newRole = {
					id: `role-${crypto.randomUUID()}`,
					name: args.name,
					imageId: args.imageId,
					description: args.description || "",
					color: args.color || "#000000",
					initCode: args.initCode || "",
				};
				mapDataStore.addRole(newRole as any);
				sendMCPFeedback("add_role", true, `添加角色成功: ${args.name}`, { id: newRole.id, name: args.name });
				return JSON.parse(JSON.stringify(newRole));
			}

			case "update_role": {
				const role = mapDataStore.findRoleById(args.roleId);
				if (!role) throw new Error("Role not found");
				const updated = { ...role };
				if (args.name !== undefined) updated.name = args.name;
				if (args.description !== undefined) updated.description = args.description;
				if (args.color !== undefined) updated.color = args.color;
				if (args.initCode !== undefined) updated.initCode = args.initCode;
				mapDataStore.editRole(updated);
				sendMCPFeedback("update_role", true, `更新角色成功: ${updated.name}`, { id: args.roleId, name: updated.name });
				return JSON.parse(JSON.stringify(updated));
			}

			case "remove_role":
				mapDataStore.removeRole(args.roleId);
				sendMCPFeedback("remove_role", true, `删除角色成功`, { id: args.roleId });
				return { success: true };

			// Chance Card Tools
			case "get_chance_cards":
				return JSON.parse(JSON.stringify(mapDataStore.chanceCards));

			case "add_chance_card": {
				const newCard = {
					id: `card-${crypto.randomUUID()}`,
					name: args.name,
					type: args.type,
					description: args.description,
					color: args.color,
					iconId: args.iconId,
					effectCode: args.effectCode,
				};
				mapDataStore.addChanceCard(newCard as any);
				sendMCPFeedback("add_chance_card", true, `添加机会卡成功: ${args.name}`, { id: newCard.id, name: args.name });
				return JSON.parse(JSON.stringify(newCard));
			}

			case "remove_chance_card":
				mapDataStore.reomveChanceCard(args.cardId);
				sendMCPFeedback("remove_chance_card", true, `删除机会卡成功`, { id: args.cardId });
				return { success: true };

			// Game Phase Tools
			case "get_phases":
				return JSON.parse(JSON.stringify(mapDataStore.phases));

			case "add_phase": {
				if (!args.phaseType) {
					throw new Error("phaseType is required (gameOverRule, gameInited, gameRoundStart, playerRound, gameRoundEnd)");
				}
				const newPhase = {
					id: args.id,
					name: args.name,
					description: args.description,
					mark: args.mark,
					from: args.from,
					initEventCode: args.initEventCode,
				};
				// Add to the appropriate phase category
				const phaseType = args.phaseType as PhaseType;
				if (mapDataStore.phases[phaseType]) {
					(mapDataStore.phases[phaseType] as any).push(newPhase);
				}
				sendMCPFeedback("add_phase", true, `添加游戏阶段成功: ${args.name}`, { id: args.id, name: args.name, phaseType });
				return JSON.parse(JSON.stringify(newPhase));
			}

			case "remove_phase": {
				if (!args.phaseType) {
					throw new Error("phaseType is required (gameOverRule, gameInited, gameRoundStart, playerRound, gameRoundEnd)");
				}
				const phaseType = args.phaseType as PhaseType;
				const phaseArray = mapDataStore.phases[phaseType];
				if (!phaseArray) throw new Error("Phase type not found");
				const index = phaseArray.findIndex((p) => p.id === args.phaseId);
				if (index < 0) throw new Error("Phase not found");
				phaseArray.splice(index, 1);
				sendMCPFeedback("remove_phase", true, `删除游戏阶段成功`, { id: args.phaseId, phaseType });
				return { success: true };
			}

			case "update_phase": {
				if (!args.phaseType) {
					throw new Error("phaseType is required (gameOverRule, gameInited, gameRoundStart, playerRound, gameRoundEnd)");
				}
				const phaseType = args.phaseType as PhaseType;
				const phaseArray = mapDataStore.phases[phaseType];
				if (!phaseArray) throw new Error("Phase type not found");
				const phase = phaseArray.find((p) => p.id === args.phaseId);
				if (!phase) throw new Error("Phase not found");
				if (args.name !== undefined) phase.name = args.name;
				if (args.description !== undefined) phase.description = args.description;
				if (args.mark !== undefined) phase.mark = args.mark;
				if (args.initEventCode !== undefined) phase.initEventCode = args.initEventCode;
				sendMCPFeedback("update_phase", true, `更新游戏阶段成功: ${phase.name}`, { id: args.phaseId, name: phase.name });
				return JSON.parse(JSON.stringify(phase));
			}

			// UI Template Tools
			case "get_ui_templates":
				return JSON.parse(JSON.stringify(mapDataStore.uiTemplates));

			case "add_ui_template": {
				const newTemplate = {
					id: args.id,
					slug: args.slug,
					name: args.name,
					template: args.template,
				};
				mapDataStore.saveUITemplate(newTemplate as any);
				sendMCPFeedback("add_ui_template", true, `添加UI模板成功: ${args.name}`, { id: args.id, name: args.name, slug: args.slug });
				return JSON.parse(JSON.stringify(newTemplate));
			}

			case "remove_ui_template":
				mapDataStore.removeUITemplate(args.templateId);
				sendMCPFeedback("remove_ui_template", true, `删除UI模板成功`, { id: args.templateId });
				return { success: true };

			case "update_ui_template": {
				const template = mapDataStore.uiTemplates.find((t) => t.id === args.templateId);
				if (!template) throw new Error("UI template not found");
				const updated: any = { ...template };
				if (args.slug !== undefined) updated.slug = args.slug;
				if (args.name !== undefined) updated.name = args.name;
				if (args.template !== undefined) updated.template = args.template;
				mapDataStore.saveUITemplate(updated);
				sendMCPFeedback("update_ui_template", true, `更新UI模板成功: ${updated.name}`, { id: args.templateId, name: updated.name });
				return JSON.parse(JSON.stringify(updated));
			}

			// Custom UI Tools
			case "get_custom_uis":
				return JSON.parse(JSON.stringify(mapDataStore.customUIs));

			case "add_custom_ui": {
				const newCustomUI = {
					id: args.id,
					name: args.name,
					layout: args.layout,
					uiSchema: args.uiSchema,
				};
				mapDataStore.saveCustomUI(newCustomUI as any);
				sendMCPFeedback("add_custom_ui", true, `添加自定义UI成功: ${args.name}`, { id: args.id, name: args.name });
				return JSON.parse(JSON.stringify(newCustomUI));
			}

			case "remove_custom_ui":
				mapDataStore.removeCustomUI(args.customUIId);
				sendMCPFeedback("remove_custom_ui", true, `删除自定义UI成功`, { id: args.customUIId });
				return { success: true };

			case "update_custom_ui": {
				const customUI = mapDataStore.customUIs.find((u) => u.id === args.customUIId);
				if (!customUI) throw new Error("Custom UI not found");
				const updated: any = { ...customUI };
				if (args.name !== undefined) updated.name = args.name;
				if (args.layout !== undefined) updated.layout = args.layout;
				if (args.uiSchema !== undefined) updated.uiSchema = args.uiSchema;
				mapDataStore.saveCustomUI(updated);
				sendMCPFeedback("update_custom_ui", true, `更新自定义UI成功: ${updated.name}`, { id: args.customUIId, name: updated.name });
				return JSON.parse(JSON.stringify(updated));
			}

			// Game Setting Tools
			case "get_game_setting_form":
				return JSON.parse(JSON.stringify(mapDataStore.gameSettingForm));

			case "update_game_setting_form":
				mapDataStore.updateGameSettingFrom(args.form);
				sendMCPFeedback("update_game_setting_form", true, `更新游戏设置表单成功`, { fieldCount: args.form.length });
				return JSON.parse(JSON.stringify(mapDataStore.gameSettingForm));

			// Extra Libs Tools
			case "get_extra_libs":
				return mapDataStore.extraLibs || "";

			case "update_extra_libs":
				mapDataStore.extraLibs = args.code;
				sendMCPFeedback("update_extra_libs", true, `更新额外库代码成功`, { codeLength: args.code.length });
				return mapDataStore.extraLibs;

			// File Operation Tools
			case "create_new_map": {
				const defaultData = createDefaultMapData();
				// Reset store state with default data
				const storeState = mapDataStore.$state;
				Object.assign(storeState, defaultData);
				return { success: true, message: "Created new map" };
			}

			case "load_map_file":
				// This needs to be handled by the file loading logic
				throw new Error("load_map_file must be handled through the file dialog");

			case "save_map_file":
				// This needs to be handled by the file saving logic
				throw new Error("save_map_file must be handled through the save dialog");

			case "get_current_file_path":
				return editorStore.currentFilePath;

			// Analysis Tools
			case "validate_map": {
				const errors: string[] = [];
				const warnings: string[] = [];

				// Check for duplicate coordinates
				const coordMap = new Map<string, string[]>();
				mapDataStore.mapItems.forEach((item) => {
					const key = `${item.x},${item.y}`;
					if (!coordMap.has(key)) coordMap.set(key, []);
					coordMap.get(key)!.push(item.id);
				});

				coordMap.forEach((itemIds, key) => {
					if (itemIds.length > 1) {
						errors.push(`Duplicate coordinates at ${key}: ${itemIds.join(", ")}`);
					}
				});

				// Check map index
				if (mapDataStore.mapIndex.length === 0) {
					errors.push("Map index is empty");
				}

				// Check for orphaned linked items
				mapDataStore.mapItems.forEach((item) => {
					if (item.linkto && !mapDataStore.findMapItemById(item.linkto)) {
						errors.push(`Item ${item.id} links to non-existent item ${item.linkto}`);
					}
					if (item.beLinked && !item.property) {
						warnings.push(`Linked item ${item.id} does not have property data`);
					}
				});

				return {
					errors,
					warnings,
					isValid: errors.length === 0,
				};
			}

			case "find_duplicates": {
				const duplicates: Array<{ x: number; y: number; items: string[] }> = [];
				const coordMap = new Map<string, string[]>();

				mapDataStore.mapItems.forEach((item) => {
					const key = `${item.x},${item.y}`;
					if (!coordMap.has(key)) coordMap.set(key, []);
					coordMap.get(key)!.push(item.id);
				});

				coordMap.forEach((itemIds, key) => {
					if (itemIds.length > 1) {
						const [x, y] = key.split(",").map(Number);
						duplicates.push({ x, y, items: itemIds });
					}
				});

				return duplicates;
			}

			case "analyze_map_layout": {
				const items = mapDataStore.mapItems;
				if (items.length === 0) {
					return {
						bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
						emptySpots: [],
						clusters: [],
					};
				}

				let minX = Infinity,
					maxX = -Infinity,
					minY = Infinity,
					maxY = -Infinity;

				items.forEach((item) => {
					minX = Math.min(minX, item.x);
					maxX = Math.max(maxX, item.x);
					minY = Math.min(minY, item.y);
					maxY = Math.max(maxY, item.y);
				});

				return {
					bounds: { minX, maxX, minY, maxY },
					emptySpots: [],
					clusters: [],
				};
			}

			default:
				throw new Error(`Unknown tool: ${toolName}`);
		}
	} catch (error: any) {
		console.error(`Error executing MCP tool ${toolName}:`, error);
		// 发送错误反馈
		sendMCPFeedback(toolName, false, `操作失败: ${error.message}`, { error: error.message });
		throw error;
	}
}
