<script setup lang="ts">
import { computed } from "vue";
import playerCard from "./player-card.vue";
import { useRouter } from "vue-router";
import { useGameData } from "@src/store/game";
import type { PlayerInfo } from "@mine-monopoly/types";

const router = useRouter();
const gameData = useGameData();
const isGameOver = computed(() => gameData.isGameOver);
const playerListSorted = computed(() => {
	const ranking = gameData.rankedPlayerIds;
	if (ranking.length > 0) {
		const rankedIds = new Set(ranking);
		const ranked = ranking
			.map((id) => gameData.players.find((p) => p.id === id))
			.filter((p): p is PlayerInfo => p !== undefined);
		const unranked = gameData.players.filter((p) => !rankedIds.has(p.id));
		return [...ranked, ...unranked];
	}
	return [...gameData.players].sort((playerA, playerB) => playerB.money - playerA.money);
});

function toRoomList() {
	useGameData().$reset();
	router.replace("/room");
}
</script>

<template>
	<transition name="fade">
		<div v-if="isGameOver" class="scoreboard">
			<div class="contianer">
				<div class="title">游戏结束</div>
				<div class="player-list-container">
					<div class="player-container" v-for="(player, index) in playerListSorted" :key="player.id">
						<div class="No">{{ index + 1 }}</div>
						<playerCard :player="player" :round-mark="false" />
					</div>
				</div>
				<div class="go-back">
					<button @click="toRoomList">返回大厅</button>
				</div>
			</div>
		</div>
	</transition>
</template>

<style lang="scss" scoped>
.scoreboard {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: var(--z-scoreboard);

	& > span {
		margin-top: 0.8em;
		color: #eeeeee;
	}
}

.contianer {
	width: 30rem;
	height: 60%;
	border-radius: 0.8rem;
	overflow: hidden;
	background-color: var(--fp-color-bg-light);
	display: flex;
	flex-direction: column;
}

.title {
	width: 100%;
	height: 3rem;
	line-height: 3rem;
	font-size: 1.8rem;
	background-color: var(--fp-color-primary);
	color: white;
	padding: 0 10px;
}

.No {
	min-width: 3rem;
	height: 3rem;
	border-radius: 50%;
	margin-right: 1rem;
	text-align: center;
	line-height: 3rem;
	font-size: 2rem;
	background-color: var(--fp-color-primary);
}

.player-list-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	color: #fff;
}

.player-container {
	width: 25rem;
	display: flex;
	justify-content: space-around;
	align-items: center;
}

.go-back {
	width: 100%;

	button {
		width: 100%;
		height: 2rem;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
