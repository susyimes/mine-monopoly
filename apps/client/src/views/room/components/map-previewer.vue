<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { GameMapInDb } from "@fatpaper-monopoly/types";
import { PROTOCOL } from "@fatpaper-monopoly/config";

const { map } = defineProps<{ map: GameMapInDb }>();

const coverImageUrl = computed(() => `${PROTOCOL}://${map.coverUrl}`);
</script>

<template>
	<div class="map-preview">
		<div class="map-info">
			<div class="name">{{ map.name }}</div>
		</div>
		<div class="map-cover-container">
			<img class="map-cover" :src="coverImageUrl" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.map-preview {
	width: 100%;
	height: 100%;
	border: 0.4rem solid #ffffff;
	border-radius: 1rem;
	box-sizing: border-box;
	overflow: hidden;
	position: relative;
	cursor: pointer;
}
.map-info {
	position: absolute;
	width: 100%;
	height: 100%;
	left: 0;
	top: 0;
	z-index: 100;

	& > .name {
		width: auto;
		display: inline-block;
		padding: 0.6em 1em;
		border-radius: 0 0.6em 0.6em 0.6em;
		background-color: var(--color-second);
		color: var(--color-text-white);
	}
}
.map-cover-container {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #ddd;
	padding: 0.5rem;
	box-sizing: border-box;

	.map-cover {
		display: block;
		width: auto;
		height: auto;
		object-fit: contain;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		margin: auto;
		border-radius: 0.6em;
	}
}
</style>
