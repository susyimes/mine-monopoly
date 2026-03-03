<script setup lang="ts">
import { useEditorStore, useMapDataStore } from "@src/stores";
import MapItemInfo from "../common/map-item-info.vue";
import PropertyForm from "../manager/forms/property-form/index.vue";
import MapEventSelector from "../common/map-event-selector.vue";
import { computed, ref } from "vue";
import { eventBus } from "@src/utils/event-bus";
import { message } from "ant-design-vue";

const editorStore = useEditorStore();
const currentMapItemId = computed(() => editorStore.currentMapItemId);
const currentMapItem = computed(() => editorStore.currentMapItem);
const isLinkMode = computed(() => editorStore.isLinkMode);
const otherMapItemId = ref("");
const selectedCount = computed(() => editorStore.selectedMapItemIds.length);
const hasMultipleSelection = computed(() => editorStore.hasMultipleSelection);
const selectedItems = computed(() => editorStore.selectedMapItems);
const canMove = computed(() => {
  const result = editorStore.selectedMapItemIds.length > 0;
  console.log('[移动按钮状态] canMove:', result, '选中项数量:', editorStore.selectedMapItemIds.length);
  return result;
});

eventBus.on("other-map-item-selected", (id) => {
	otherMapItemId.value = id;
});

function handleMove(direction: 'up' | 'down' | 'left' | 'right') {
	console.log('[移动函数] handleMove 被调用，方向:', direction);

	const store = useEditorStore();
	console.log('[移动函数] 选中项数量:', store.selectedMapItemIds.length);
	console.log('[移动函数] 选中项IDs:', store.selectedMapItemIds);

	if (store.selectedMapItemIds.length === 0) {
		message.info("未选中任何 MapItem", 1);
		return;
	}

	let deltaX = 0;
	let deltaY = 0;

	switch (direction) {
		case 'up':
			deltaY = -1;
			break;
		case 'down':
			deltaY = 1;
			break;
		case 'left':
			deltaX = -1;
			break;
		case 'right':
			deltaX = 1;
			break;
	}

	console.log('[移动函数] 移动增量:', deltaX, deltaY);
	console.log('[移动函数] 准备发送事件');

	try {
		// 通过 eventBus 通知 renderer 执行移动
		eventBus.emit('batch-move-map-items', {
			ids: store.selectedMapItemIds,
			deltaX,
			deltaY
		});
		console.log('[移动函数] 事件已发送');
	} catch (e: any) {
		console.error('[移动函数] 发送事件失败:', e);
		message.error(e.message, 2);
	}
}

function handleStartLink() {
	if (isLinkMode.value) {
		if (currentMapItemId.value) {
			try {
				useMapDataStore().linkToMapItem(currentMapItemId.value, otherMapItemId.value);
				editorStore.$patch({
					currentMapItemId: "",
					isLinkMode: false,
				});
				message.success("绑定成功", 1);
				eventBus.emit("change-link-mode", false);
			} catch (e: any) {
				message.error(e.message, 1);
			}
		}
	} else {
		editorStore.isLinkMode = true;
		message.info("请选择另一个MapItem成为地皮");
	}
}

function handleUnLink() {
	if (currentMapItemId.value) {
		try {
			useMapDataStore().unLinkMapItem(currentMapItemId.value);
			message.success("解除绑定成功", 1);
		} catch (e: any) {
			message.error(e.message, 1);
		}
	}
}

function handleMapItemDelete() {
	if (selectedCount.value > 0) {
		try {
			useMapDataStore().batchRemoveMapItem(editorStore.selectedMapItemIds);
			editorStore.clearSelectedMapItemIds();
			message.success("删除成功", 1);
		} catch (e: any) {
			message.error(e.message, 1);
		}
	}
}
</script>

<template>
	<div class="select-mode-ui">
		<div class="ui-container left">
			<a-space direction="vertical">
				<!-- 多选状态提示 -->
				<template v-if="hasMultipleSelection">
					<div class="multi-select-panel">
						<div class="panel-title">批量操作</div>
						<a-alert type="info" :message="`已选中 ${selectedCount} 个 MapItem`" show-icon />

						<!-- 方向控制按钮 -->
						<div class="move-controls">
							<div class="direction-pad">
								<a-button
									type="primary"
									@click="() => handleMove('up')"
									:disabled="!canMove"
									class="direction-btn"
								>
									<font-awesome-icon :icon="['fas', 'arrow-up']" />
								</a-button>
								<div class="horizontal-buttons">
									<a-button
										type="primary"
										@click="() => handleMove('left')"
										:disabled="!canMove"
										class="direction-btn"
									>
										<font-awesome-icon :icon="['fas', 'arrow-left']" />
									</a-button>
									<!-- 占位元素，使左右按钮间隔一个按钮的宽度 -->
									<div class="direction-btn placeholder"></div>
									<a-button
										type="primary"
										@click="() => handleMove('right')"
										:disabled="!canMove"
										class="direction-btn"
									>
										<font-awesome-icon :icon="['fas', 'arrow-right']" />
									</a-button>
								</div>
								<a-button
									type="primary"
									@click="() => handleMove('down')"
									:disabled="!canMove"
									class="direction-btn"
								>
									<font-awesome-icon :icon="['fas', 'arrow-down']" />
								</a-button>
							</div>
						</div>

						<a-button type="primary" danger @click="handleMapItemDelete">
							批量删除 (Delete)
						</a-button>
					</div>
				</template>

				<!-- 单选状态 -->
				<template v-if="currentMapItem && !hasMultipleSelection">
					<map-event-selector v-if="!currentMapItem.beLinked" />
					<map-item-info :map-item="currentMapItem"></map-item-info>
					<a-button
						type="primary"
						v-if="!(currentMapItem.linkto || currentMapItem.beLinked)"
						@click="handleStartLink"
					>
						绑定地皮
					</a-button>
					<a-button type="primary" danger v-else @click="handleUnLink">解除绑定</a-button>
					<a-button type="primary" @click="handleMapItemDelete" danger v-if="currentMapItem">
						删除这个MapItem
					</a-button>
				</template>
			</a-space>
		</div>
		<div class="ui-container right">
			<a-space direction="vertical">
				<template v-if="currentMapItem && currentMapItem.beLinked && !hasMultipleSelection">
					<property-form />
				</template>
			</a-space>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.select-mode-ui {
	width: 100%;
	height: 100%;
	position: relative;

	.ui-container {
		position: absolute;
		height: 100%;
		top: 0;
		margin: 10px;

		& > * {
			pointer-events: initial;
		}
	}

	.left {
		left: 0;
		max-height: 90vh;
		overflow-y: auto;
	}

	.right {
		right: 0;
	}

	.multi-select-panel {
		background-color: white;
		padding: 12px;
		border-radius: 4px;
		border: 1px solid #d9d9d9;

		.panel-title {
			font-size: 16px;
			font-weight: 600;
			margin-bottom: 12px;
			color: #1890ff;
		}

		.ant-alert {
			margin-bottom: 12px;
		}

		.move-controls {
			padding: 12px;
			border: 1px solid #d9d9d9;
			border-radius: 4px;
			background-color: #fafafa;
			margin-bottom: 12px;

			.direction-pad {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 8px;

				.direction-btn {
					width: 36px;
					height: 36px;
					padding: 0;
					display: flex;
					align-items: center;
					justify-content: center;

					&.placeholder {
						visibility: hidden;
					}
				}

				.horizontal-buttons {
					display: flex;
					gap: 8px;
				}
			}
		}
	}
}
</style>
