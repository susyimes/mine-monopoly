<script setup lang="ts">
import { useMapDataStore } from "@src/stores";
import { renderObjectTree } from "@src/utils/object-viewer";
import { nextTick, onUpdated, ref } from "vue";

const visible = defineModel({ default: false });

const mapDataViewerContainer = ref<HTMLDivElement | null>(null);

onUpdated(async () => {
	if (visible.value) {
		nextTick(() => {
			if (!mapDataViewerContainer.value) return;
			renderObjectTree(mapDataViewerContainer.value, JSON.parse(JSON.stringify(useMapDataStore().$state)));
		});
	}
});
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
