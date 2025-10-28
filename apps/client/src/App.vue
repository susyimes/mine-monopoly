<script setup lang="ts">
import FullScreenMask from "@src/views/screen_mask/screen_mask.vue";
import Loading from "@src/components/utils/fp-loading/fp-loading.vue";
import Background from "@src/views/background/background.vue";
import StatusBar from "@src/views/status_bar/status_bar.vue";
import { computed, nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import Chat from "@src/views/chat_log/chat_log.vue";
import MusicPlayer from "@src/views/music_player/music_player.vue";
import DanmakuContainer from "@src/views/danmaku/danmaku_container.vue";
import { isMobileDevice } from "@src/utils";
import { TitleBar } from "@fatpaper-monopoly/ui";
import { isPC } from "./utils/platform";

const isMobile = isMobileDevice();
const router = useRoute();
const isInGame = computed(() => router.name === "game");
const canChat = computed(() => router.name === "room" || router.name === "game");
const isMusicPlayerVisiable = computed(() => router.name !== "login");
const version = isPC() ? window.electronAPI.getVersion() : "none";
</script>

<template>
	<TitleBar style="z-index: var(--z-topbar)" v-if="isPC()" :bg-color="'#f38b11'">
		<template #title>
			<span style="font-size: 12px">FatPaper-Monopoly v{{ version }}</span>
		</template>
	</TitleBar>
	<div class="main-container" id="fpmessage-container">
		<!-- <FullScreenMask v-if="isMobile" /> -->
		<Chat v-if="canChat" />
		<DanmakuContainer v-if="canChat" />
		<Background v-if="!isInGame" />
		<Loading />
		<StatusBar />
		<MusicPlayer v-if="isMusicPlayerVisiable" />
		<RouterView></RouterView>
	</div>
</template>

<style lang="scss" scoped>
.main-container {
	flex: 1;
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
