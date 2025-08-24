<script setup lang="ts">
import { ref } from "vue";
import MapForm from "./components/map-form.vue";
import { GameMapInDb } from "@fatpaper-monopoly/types";

const formVisible = ref(false);
const currentGameMap = ref<GameMapInDb | undefined>();
</script>

<template>
	<div class="map-manager">
		<div class="top-bar">
			<div class="left">
				<h4>地图管理</h4>
			</div>
			<div class="right">
				<a-button @click="formVisible = true" type="primary">上传地图</a-button>
			</div>
		</div>

		<div class="map-item-container"></div>
	</div>

	<a-modal destroyOnClose title="上传地图" style="width: 30vw" v-model:open="formVisible" :footer="null">
		<map-form :game-map="currentGameMap" :model-value="formVisible" />
	</a-modal>
</template>

<style lang="scss" scoped>
.map-manager {
	padding: 10px;

	.top-bar {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #fff;
		padding: 10px 20px;
		border-radius: 5px;
	}
}
</style>
