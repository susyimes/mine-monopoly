<script setup lang="ts">
import { RoomMapItem } from "@/interfaces/interfaces";
import RoomItem from "./components/room-item.vue";
import { getRoomList } from "@/utils/api/room-list";
import { onBeforeUnmount, onMounted, ref } from "vue";

const roomList = ref<RoomMapItem[]>([]);
let setTimeOutId: any;

async function updateRoomList() {
	roomList.value = await getRoomList();
	setTimeOutId = setTimeout(updateRoomList, 2000);
}

onMounted(() => {
	updateRoomList();
});

onBeforeUnmount(() => {
	clearTimeout(setTimeOutId);
});
</script>

<template>
	<div class="dashboard">
		<div class="room-list-container">
			<div class="room-list-title">当前房间列表({{ roomList.length }})</div>
			<div class="room-list">
				<RoomItem :room="room" v-for="room in roomList" :key="room.roomId" />
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.dashboard {
	height: 100%;
	.room-list-container {
		display: flex;
		flex: 1;
		justify-content: space-between;
		flex-direction: column;
		height: 100%;
		padding: 20px;
		border-radius: 20px;
		box-shadow: var(--el-box-shadow-light);
		box-sizing: border-box;

		& > .room-list-title {
			font-weight: bold;
			margin-bottom: 10px;
		}

		& > .room-list {
			flex: 1;
			display: flex;
			justify-content: flex-start;
			align-content: flex-start;
			overflow-y: scroll;
			flex-wrap: wrap;
		}
	}
}
</style>
