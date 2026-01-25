<script setup lang="ts">
import { useMapDataStore } from "@src/stores";
import { renderObjectTree } from "@src/utils/object-viewer";
import { clone, cloneDeep } from "lodash";
import { nextTick, onUpdated, ref, watch } from "vue";

const visible = defineModel({ default: false });

const mapDataViewerContainer = ref<HTMLDivElement | null>(null);

watch(
	() => visible.value,
	async (isOpen) => {
		if (isOpen) {
			await nextTick(); // 等待 DOM 渲染（Modal 打开）

			if (!mapDataViewerContainer.value) return;

			try {
				const data = cloneDeep(useMapDataStore().$state);
				const json = {
					properties: data.mapItems.filter((m) => m.property !== undefined).map((m) => m.property),
					...data,
				};

				// 清空旧内容（防止重复渲染）
				mapDataViewerContainer.value.innerHTML = "";

				// 渲染树
				renderObjectTree(mapDataViewerContainer.value, json);
			} catch (e) {
				console.error("渲染 JSON 失败", e);
			}
		}
	},
	{ immediate: true },
);
</script>

<template>
	<a-modal destroyOnClose :footer="null" width="70%" v-model:open="visible" title="地图Data">
		<div ref="mapDataViewerContainer" class="json-viewer-container"></div>
	</a-modal>
</template>

<style lang="scss" scoped>
.json-viewer-container {
	width: 100%;
	height: 70vh;
	overflow-y: scroll;
}
</style>
