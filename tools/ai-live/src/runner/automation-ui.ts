import type { Locator, Page } from "playwright";

export type LobbyUser = {
	username: string;
	isOwner: boolean;
	isReady: boolean;
};

export type MapSelectionResult = {
	mapId: string;
	selectedIndex: number;
	usedFallback: boolean;
};

export type UiRouteOptions = {
	automationQuery?: boolean;
};

const ROOM_ROUTER_INPUT = "input[placeholder*='房间号']";
const ROOM_PAGE_MARKER = ".room-page";
const ROOM_USER_CARD = ".room-user-card";
const SELECT_MAP_BUTTON = ".select-map-button";
const MAP_COVER_CONTAINER = ".map-cover-container";
const DIALOG_ITEM = ".fp-dialog .item-selector .items";
const DIALOG_CONFIRM_BUTTON = ".fp-dialog-footer button";
const READY_BUTTON = ".ready-button";

export async function gotoClientRoute(page: Page, clientUrl: string, route: string, options: UiRouteOptions = {}) {
	const normalizedClientUrl = clientUrl.replace(/\/+$/, "");
	if (route.startsWith("/room-router")) {
		const routeWithQuery = `${route}${options.automationQuery === false ? "" : route.includes("?") ? "&automation=1" : "?automation=1"}`;
		const historyUrl = `${normalizedClientUrl}${routeWithQuery}`;
		const hashUrl = `${normalizedClientUrl}/#${routeWithQuery}`;

		await page.goto(hashUrl, { waitUntil: "domcontentloaded" });
		if (await isExpectedRouteReady(page, route)) return;
		await continueFromLoginIfNeeded(page);
		if (await isExpectedRouteReady(page, route)) return;

		await page.goto(historyUrl, { waitUntil: "domcontentloaded" });
		if (await isExpectedRouteReady(page, route)) return;

		await continueFromLoginIfNeeded(page);
		await expectExpectedRoute(page, route);
		return;
	}

	const routeWithQuery = `${route}${options.automationQuery === false ? "" : route.includes("?") ? "&automation=1" : "?automation=1"}`;
	const historyUrl = `${normalizedClientUrl}${routeWithQuery}`;
	const hashUrl = `${normalizedClientUrl}/#${routeWithQuery}`;

	await page.goto(hashUrl, { waitUntil: "domcontentloaded" });
	if (await isExpectedRouteReady(page, route)) return;
	await continueFromLoginIfNeeded(page);
	if (await isExpectedRouteReady(page, route)) return;

	await page.goto(historyUrl, { waitUntil: "domcontentloaded" });
	await expectExpectedRoute(page, route);
}

async function continueFromLoginIfNeeded(page: Page) {
	if (await isVisible(page.locator(ROOM_ROUTER_INPUT).first())) return;
	const continueTip = page.getByText("点击任意位置继续").first();
	for (let attempt = 0; attempt < 6; attempt += 1) {
		if (await isVisible(page.locator(ROOM_ROUTER_INPUT).first())) return;
		if (await isVisible(continueTip)) {
			await continueTip.click();
			return;
		}
		await page.waitForTimeout(500);
	}
}

export async function joinRoomFromRouter(page: Page, roomId: string) {
	await page.locator(ROOM_ROUTER_INPUT).waitFor({ state: "visible" });
	await page.locator(ROOM_ROUTER_INPUT).fill(roomId);
	await page.getByRole("button", { name: /加入\/创建房间|加入|创建/ }).first().click();
	await waitForRoomPage(page);
}

export async function waitForRoomPage(page: Page) {
	await page.locator(ROOM_PAGE_MARKER).waitFor({ state: "visible" });
	await page.getByText(/房间ID:/).first().waitFor({ state: "visible" });
}

export async function configureHostRoom(
	page: Page,
	options: {
		mapId?: string;
		roundTimeSeconds?: number;
		makePublic?: boolean;
	}
): Promise<MapSelectionResult> {
	if (options.makePublic) await makeRoomPublic(page);
	const mapSelection = await selectMap(page, options.mapId);
	if (options.roundTimeSeconds) await setRoundTime(page, options.roundTimeSeconds);
	return mapSelection;
}

export async function selectMap(page: Page, mapId = "auto"): Promise<MapSelectionResult> {
	const selectButton = page.locator(SELECT_MAP_BUTTON).getByRole("button", { name: /选择地图/ }).first();
	await selectButton.waitFor({ state: "visible" });

	const currentText = (await page.locator(MAP_COVER_CONTAINER).first().textContent())?.trim() ?? "";
	if (currentText && !/选择地图|先选择地图/.test(currentText) && mapId === "auto") {
		return { mapId, selectedIndex: -1, usedFallback: false };
	}

	await clickWithFallback(selectButton);
	const dialog = page.locator(".fp-dialog").filter({ hasText: /选择地图/ }).last();
	await dialog.waitFor({ state: "visible" });
	const mapItems = dialog.locator(".item-selector > .items");
	await mapItems.first().waitFor({ state: "visible" });

	const resolvedIndex = await resolveMapIndexFromClient(page, mapId);
	const itemCount = await mapItems.count();
	const selectedIndex = resolvedIndex >= 0 && resolvedIndex < itemCount ? resolvedIndex : 0;
	await clickWithFallback(mapItems.nth(selectedIndex));
	await dialog.locator(DIALOG_CONFIRM_BUTTON).filter({ hasText: "确认" }).first().click();

	await page.waitForFunction(
		(selector) => {
			const text = document.querySelector(selector)?.textContent?.trim() ?? "";
			return text.length > 0 && !/上传地图|选择官方地图|选择地图|先选择地图/.test(text);
		},
		MAP_COVER_CONTAINER,
		{ timeout: 15_000 }
	);

	return {
		mapId,
		selectedIndex,
		usedFallback: selectedIndex !== resolvedIndex,
	};
}

export async function setRoundTime(page: Page, roundTimeSeconds: number) {
	const bridgeUpdated = await page
		.evaluate(async (value) => {
			type RoomField = { key?: string; label?: string; defaultValue?: unknown; type?: string };
			const bridge = (window as typeof window & {
				__AI_LIVE_CLIENT_BRIDGE__?: {
					getRoomState?: () => { gameSetting?: Record<string, unknown>; gameSettingForm?: RoomField[] };
					changeGameSetting?: (setting: Record<string, unknown>) => unknown;
				};
			}).__AI_LIVE_CLIENT_BRIDGE__;
			if (typeof bridge?.getRoomState !== "function" || typeof bridge.changeGameSetting !== "function") return false;
			const roomState = bridge.getRoomState();
			const field = (roomState.gameSettingForm ?? []).find((item) =>
				item.key === "turnTimeout" || /回合倒计时|回合时间|turnTimeout/.test(`${item.label ?? ""} ${item.key ?? ""}`)
			);
			if (!field?.key) return false;
			const nextSetting: Record<string, unknown> = { ...(roomState.gameSetting ?? {}) };
			for (const item of roomState.gameSettingForm ?? []) {
				if (!item.key || nextSetting[item.key]) continue;
				const defaultValue = item.defaultValue ?? "";
				nextSetting[item.key] = {
					label: item.label ?? item.key,
					value: defaultValue,
					displayValue: String(defaultValue),
				};
			}
			nextSetting[field.key] = {
				label: field.label ?? field.key,
				value,
				displayValue: String(value),
			};
			await bridge.changeGameSetting({
				...nextSetting,
			});
			return true;
		}, roundTimeSeconds)
		.catch(() => false);
	if (bridgeUpdated) {
		await page.waitForTimeout(500);
		return;
	}

	const roundTimeInput = page
		.locator(".map-option .options")
		.filter({ hasText: "回合时间" })
		.locator("input[type='number']")
		.first();

	if (await isVisible(roundTimeInput)) {
		await roundTimeInput.fill(String(roundTimeSeconds));
		await page.getByRole("button", { name: /更新设置/ }).first().click();
		await page.waitForTimeout(500);
		return;
	}

	const gameSettingButton = page.getByRole("button", { name: /修改地图参数/ }).first();
	if (!(await isVisible(gameSettingButton))) return;

	await gameSettingButton.click();
	const dialog = page.locator(".fp-dialog").last();
	await dialog.waitFor({ state: "visible", timeout: 5_000 });
	const turnTimeoutInput = dialog.locator("input#turnTimeout, input[name='turnTimeout']").first();
	const labeledTurnTimeoutInput = dialog
		.locator(".form-group, .form-item, .custom-form-item")
		.filter({ hasText: /回合倒计时|回合时间|turnTimeout/ })
		.locator("input[type='number']")
		.first();
	const input = (await isVisible(turnTimeoutInput)) ? turnTimeoutInput : labeledTurnTimeoutInput;
	if (!(await isVisible(input))) {
		await closeBlockingDialogs(page);
		return;
	}
	await input.fill(String(roundTimeSeconds));
	await input.blur().catch(() => undefined);
	const submitButton = dialog.getByRole("button", { name: /保存地图参数|保存|确认/ }).first();
	if (await isVisible(submitButton)) {
		await submitButton.click();
		await page.waitForTimeout(500);
		await closeBlockingDialogs(page);
		await page.getByText(new RegExp(`回合倒计时\\(秒\\):\\s*${roundTimeSeconds}|回合时间.*${roundTimeSeconds}`)).first().waitFor({
			state: "visible",
			timeout: 5_000
		}).catch(() => undefined);
	} else {
		await closeBlockingDialogs(page);
	}
}

export async function ensureOwnRole(page: Page, preferredIndex: number): Promise<{ roleId?: string; changed: boolean }> {
	await page.waitForFunction(
		() => {
			const bridge = (window as typeof window & {
				__AI_LIVE_CLIENT_BRIDGE__?: {
					getRoomState?: () => { roleList?: unknown[] };
				};
			}).__AI_LIVE_CLIENT_BRIDGE__;
			const roomState = bridge?.getRoomState?.();
			return (roomState?.roleList?.length ?? 0) > 0;
		},
		undefined,
		{ timeout: 15_000 }
	);

	const result = await page.evaluate((index) => {
		type RoomRole = { id?: string };
		type RoomUser = { userId?: string; roleId?: string };
		const bridge = (window as typeof window & {
			__AI_LIVE_CLIENT_BRIDGE__?: {
				changeRole?: (roleId: string) => unknown;
				getRoomState?: () => { roleList?: RoomRole[]; userList?: RoomUser[] };
				getSnapshot?: () => { userId?: string };
			};
		}).__AI_LIVE_CLIENT_BRIDGE__;
		const roomState = bridge?.getRoomState?.();
		const snapshot = bridge?.getSnapshot?.();
		const self = (roomState?.userList ?? []).find((user) => user.userId === snapshot?.userId);
		const roles = roomState?.roleList ?? [];
		const occupiedByOthers = new Set(
			(roomState?.userList ?? [])
				.filter((user) => user.userId !== snapshot?.userId)
				.map((user) => user.roleId)
				.filter(Boolean)
		);
		const orderedRoles = roles.length > 0 ? roles.map((_, offset) => roles[(index + offset) % roles.length]) : [];
		const role = orderedRoles.find((item) => item?.id && !occupiedByOthers.has(item.id)) ?? orderedRoles[0];
		if (self?.roleId && self.roleId === role?.id) return { roleId: self.roleId, changed: false };
		if (!role?.id || typeof bridge?.changeRole !== "function") return { changed: false };
		bridge.changeRole(role.id);
		return { roleId: role.id, changed: true };
	}, preferredIndex);

	if (result.roleId) {
		await page
			.waitForFunction(
				(roleId) => {
					const bridge = (window as typeof window & {
						__AI_LIVE_CLIENT_BRIDGE__?: {
							getRoomState?: () => { userList?: Array<{ userId?: string; roleId?: string }> };
							getSnapshot?: () => { userId?: string };
						};
					}).__AI_LIVE_CLIENT_BRIDGE__;
					const roomState = bridge?.getRoomState?.();
					const snapshot = bridge?.getSnapshot?.();
					return (roomState?.userList ?? []).some((user) => user.userId === snapshot?.userId && user.roleId === roleId);
				},
				result.roleId,
				{ timeout: 10_000 }
			)
			.catch(() => undefined);
	}

	return result;
}

export async function makeRoomPublic(page: Page) {
	const button = page.getByRole("button", { name: /点击公开/ }).first();
	if (!(await isVisible(button))) return;
	await button.click();
	await page.getByRole("button", { name: /点击隐藏/ }).first().waitFor({ state: "visible", timeout: 10_000 });
}

export async function setReady(page: Page, username?: string) {
	const readyButton = page.locator(READY_BUTTON).first();
	await readyButton.waitFor({ state: "visible" });
	const text = ((await readyButton.textContent()) ?? "").trim();
	if (/取消准备/.test(text)) return;
	if (!/准备/.test(text)) throw new Error(`当前页面没有可点击的准备按钮，按钮文本为：${text}`);
	await readyButton.click();
	await page.waitForFunction(
		({ cardSelector, targetUsername }) => {
			return Array.from(document.querySelectorAll(cardSelector)).some((card) => {
				const cardUsername = card.querySelector(".username")?.textContent?.trim() ?? "";
				const isReady = Boolean(card.querySelector(".ready-tag"));
				return isReady && (!targetUsername || cardUsername === targetUsername);
			});
		},
		{ cardSelector: ROOM_USER_CARD, targetUsername: username },
		{ timeout: 15_000 }
	);
}

export async function startGame(page: Page) {
	await closeBlockingDialogs(page);
	await waitForHostCanStart(page, 30_000).catch(() => undefined);
	const bridgeStarted = await page
		.evaluate(async () => {
			const bridge = (window as typeof window & {
				__AI_LIVE_CLIENT_BRIDGE__?: { startGame?: () => unknown };
			}).__AI_LIVE_CLIENT_BRIDGE__;
			if (typeof bridge?.startGame !== "function") return false;
			await bridge.startGame();
			return true;
		})
		.catch(() => false);
	if (bridgeStarted) {
		const gameReady = await waitForGamePage(page, 12_000).then(() => true).catch(() => false);
		if (gameReady) {
			await dispatchGameInitFinished(page);
			return;
		}
	}
	const startButton = page.locator(`${READY_BUTTON}, button`).filter({ hasText: /开始游戏/ }).first();
	await startButton.waitFor({ state: "visible" });
	await page.waitForFunction(
		(selector) => {
			const button = Array.from(document.querySelectorAll<HTMLButtonElement>(selector)).find((item) =>
				/开始游戏/.test(item.textContent ?? "")
			);
			return Boolean(button && !button.disabled);
		},
		`${READY_BUTTON}, button`,
		{ timeout: 30_000 }
	);
	await startButton.click().catch(async () => {
		await closeBlockingDialogs(page);
		await startButton.click({ force: true });
	});
	await waitForGamePage(page, 60_000);
	await dispatchGameInitFinished(page);
}

async function waitForHostCanStart(page: Page, timeoutMs: number) {
	await page.waitForFunction(
		() => {
			const bridge = (window as typeof window & {
				__AI_LIVE_CLIENT_BRIDGE__?: {
					getRoomState?: () => {
						mapInfo?: unknown;
						ownerId?: string;
						userList?: Array<{ userId?: string; roleId?: string; isReady?: boolean }>;
					};
					getSnapshot?: () => { userId?: string };
				};
			}).__AI_LIVE_CLIENT_BRIDGE__;
			const roomState = bridge?.getRoomState?.();
			const snapshot = bridge?.getSnapshot?.();
			const users = roomState?.userList ?? [];
			const ownerId = roomState?.ownerId ?? snapshot?.userId;
			return Boolean(
				roomState?.mapInfo &&
				users.length > 1 &&
				users.every((user) => Boolean(user.roleId) || user.userId === ownerId || user.isReady),
			);
		},
		undefined,
		{ timeout: timeoutMs }
	);
}

async function waitForGamePage(page: Page, timeoutMs = 60_000) {
	await page.waitForFunction(
		() => {
			const bridge = (window as typeof window & {
				__AI_LIVE_CLIENT_BRIDGE__?: {
					getSnapshot?: () => {
						currentPlayerIdInRound?: string;
						players?: unknown[];
						gameInfo?: { playerList?: unknown[] };
						isGameOver?: boolean;
					};
				};
			}).__AI_LIVE_CLIENT_BRIDGE__;
			const snapshot = bridge?.getSnapshot?.();
			const hasGameData = Boolean(
				snapshot?.isGameOver ||
				snapshot?.currentPlayerIdInRound ||
				(snapshot?.players?.length ?? 0) > 0 ||
				(snapshot?.gameInfo?.playerList?.length ?? 0) > 0
			);
			const route = `${window.location.pathname}${window.location.hash}`;
			const hasGameCanvas = Boolean(document.querySelector(".game-page #game-canvas, #game_dice_canvas, #dice-canvas"));
			return hasGameData || (/\/game|#\/game/.test(route) && hasGameCanvas);
		},
		undefined,
		{ timeout: timeoutMs }
	);
	await page.waitForTimeout(1500);
	const ready = await page.evaluate(() => {
		const route = `${window.location.pathname}${window.location.hash}`;
		const hasGameCanvas = Boolean(document.querySelector(".game-page #game-canvas, #game_dice_canvas, #dice-canvas"));
		const bridge = (window as typeof window & {
			__AI_LIVE_CLIENT_BRIDGE__?: {
				getSnapshot?: () => {
					currentPlayerIdInRound?: string;
					players?: unknown[];
					gameInfo?: { playerList?: unknown[] };
					isGameOver?: boolean;
				};
			};
		}).__AI_LIVE_CLIENT_BRIDGE__;
		const snapshot = bridge?.getSnapshot?.();
		const hasGameData = Boolean(
			snapshot?.isGameOver ||
			snapshot?.currentPlayerIdInRound ||
			(snapshot?.players?.length ?? 0) > 0 ||
			(snapshot?.gameInfo?.playerList?.length ?? 0) > 0
		);
		return { route, hasGameCanvas, hasGameData, loadingText: document.body.textContent?.match(/正在[^。\\n]*/)?.[0] };
	});
	if (!ready.hasGameData && !(/\/game|#\/game/.test(ready.route) && ready.hasGameCanvas)) {
		throw new Error(`game page did not stay ready after start: ${JSON.stringify(ready)}`);
	}
}

async function dispatchGameInitFinished(page: Page) {
	await page
		.evaluate(async () => {
			const bridge = (window as typeof window & {
				__AI_LIVE_CLIENT_BRIDGE__?: { gameInitFinished?: () => unknown };
			}).__AI_LIVE_CLIENT_BRIDGE__;
			if (typeof bridge?.gameInitFinished !== "function") return false;
			await bridge.gameInitFinished();
			return true;
		})
		.catch(() => false);
}

export async function readLobbyUsers(page: Page): Promise<LobbyUser[]> {
	return await page.evaluate((cardSelector) => {
		return Array.from(document.querySelectorAll(cardSelector))
			.map((card) => {
				const username = card.querySelector(".username")?.textContent?.trim() ?? "";
				if (!username) return null;
				return {
					username,
					isOwner: Boolean(card.querySelector(".is-room-owner")),
					isReady: Boolean(card.querySelector(".ready-tag")),
				};
			})
			.filter(Boolean) as LobbyUser[];
	}, ROOM_USER_CARD);
}

export async function waitForReadyUsers(
	page: Page,
	options: {
		minReadyNonOwner: number;
		expectedUsernames?: string[];
		timeoutMs: number;
	}
): Promise<LobbyUser[]> {
	const deadline = Date.now() + options.timeoutMs;

	while (Date.now() < deadline) {
		const users = await readLobbyUsers(page);
		const readyNonOwnerCount = users.filter((user) => !user.isOwner && user.isReady).length;
		const expectedReady = (options.expectedUsernames ?? []).every((username) =>
			users.some((user) => user.username === username && user.isReady)
		);

		if (readyNonOwnerCount >= options.minReadyNonOwner && expectedReady) return users;
		await page.waitForTimeout(750);
	}

	return await readLobbyUsers(page);
}

export async function waitForHumanReadyCount(
	page: Page,
	options: {
		humanCount: number;
		timeoutMs: number;
	}
): Promise<{ readyHumans: number; users: LobbyUser[]; timedOut: boolean }> {
	if (options.humanCount <= 0) {
		return { readyHumans: 0, users: await readLobbyUsers(page), timedOut: false };
	}

	const startedAt = Date.now();
	while (Date.now() - startedAt < options.timeoutMs) {
		const users = await readLobbyUsers(page);
		const readyHumans = users.filter((user) => !user.isOwner && user.isReady).length;
		if (readyHumans >= options.humanCount) return { readyHumans, users, timedOut: false };
		await page.waitForTimeout(1_000);
	}

	const users = await readLobbyUsers(page);
	const readyHumans = users.filter((user) => !user.isOwner && user.isReady).length;
	return { readyHumans, users, timedOut: true };
}

async function resolveMapIndexFromClient(page: Page, mapId: string): Promise<number> {
	if (!mapId || mapId === "auto") return 0;

	const apiIndex = await page
		.evaluate(async (targetMapId) => {
			const locationUrl = new URL(window.location.href);
			const automation = (window as typeof window & {
				__AI_LIVE_AUTOMATION__?: { monopolyApi?: string };
			}).__AI_LIVE_AUTOMATION__;
			const apiBaseUrl = automation?.monopolyApi ?? `${locationUrl.protocol}//${locationUrl.hostname}:8181`;
			const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/game-map/list?page=1&size=1000`);
			const data = await response.json();
			const mapsList = Array.isArray(data.data?.gameMapList) ? data.data.gameMapList : [];
			return mapsList.findIndex((map: { id?: string; name?: string }) => map.id === targetMapId || map.name === targetMapId);
		}, mapId)
		.catch(() => -1);
	if (apiIndex >= 0) return apiIndex;

	const itemTexts = await page.locator(DIALOG_ITEM).allTextContents();
	return itemTexts.findIndex((text) => text.includes(mapId));
}

async function isExpectedRouteReady(page: Page, route: string): Promise<boolean> {
	if (route.startsWith("/room-router")) return await isVisible(page.locator(ROOM_ROUTER_INPUT).first());
	if (route.startsWith("/room")) return await isVisible(page.locator(ROOM_PAGE_MARKER).first());
	return true;
}

async function expectExpectedRoute(page: Page, route: string) {
	if (route.startsWith("/room-router")) {
		await page.locator(ROOM_ROUTER_INPUT).waitFor({ state: "visible" });
		return;
	}
	if (route.startsWith("/room")) {
		await waitForRoomPage(page);
	}
}

async function isVisible(locator: Locator): Promise<boolean> {
	return await locator
		.isVisible({ timeout: 1_500 })
		.catch(() => false);
}

async function clickWithFallback(locator: Locator) {
	await locator.click({ timeout: 5_000 }).catch(async () => {
		await locator.click({ force: true, timeout: 5_000 }).catch(async () => {
			await locator.dispatchEvent("click");
		});
	});
}

async function closeBlockingDialogs(page: Page) {
	for (let attempt = 0; attempt < 4; attempt += 1) {
		const dialog = page.locator(".fp-dialog").last();
		const modal = page.locator(".fp-dialog-modal").last();
		if (!(await isVisible(dialog)) && !(await isVisible(modal))) return;

		await page.keyboard.press("Escape").catch(() => undefined);
		await dialog.waitFor({ state: "hidden", timeout: 500 }).catch(() => undefined);
		if (!(await isVisible(dialog)) && !(await isVisible(modal))) return;

		const closeButton = dialog.locator(".close-button").first();
		if (await isVisible(closeButton)) {
			await closeButton.click({ force: true }).catch(() => undefined);
			await dialog.waitFor({ state: "hidden", timeout: 1_000 }).catch(() => undefined);
			continue;
		}

		const cancelButton = dialog.getByRole("button", { name: /取消|关闭/ }).first();
		if (await isVisible(cancelButton)) {
			await cancelButton.click({ force: true }).catch(() => undefined);
			await dialog.waitFor({ state: "hidden", timeout: 1_000 }).catch(() => undefined);
			continue;
		}

		if (await isVisible(modal)) {
			await modal.click({ position: { x: 4, y: 4 }, force: true }).catch(() => undefined);
			await dialog.waitFor({ state: "hidden", timeout: 1_000 }).catch(() => undefined);
		}
	}
}
