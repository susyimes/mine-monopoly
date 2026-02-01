<script setup lang="ts">
import { useMapDataStore } from "@src/stores";
import libContent from "./editor-lib.d.ts?raw";
import templateText from "./template-text?raw";
import CodeEditor from "@src/components/code-editor/index.vue";
import { ref, watch, computed } from "vue";

const props = defineProps<{
	value?: string;
}>();

const emit = defineEmits<{
	save: [value: string];
}>();

const extraLibs = computed(() => useMapDataStore().extraLibs);
const localCode = ref(props.value || "");

// 监听外部值变化，更新本地编辑状态
watch(
	() => props.value,
	(newVal) => {
		localCode.value = newVal || "";
	}
);

const handleSave = () => {
	emit("save", localCode.value);
};
</script>

<template>
	<div class="effect-editor-wrapper">
		<div class="editor-container">
			<code-editor v-model="localCode" :template-text="templateText" :extra-libs="[extraLibs, libContent]" />
		</div>
		<div class="save-bar">
			<a-button type="primary" @click="handleSave">保存</a-button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.effect-editor-wrapper {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.editor-container {
	width: 100%;
	height: 70vh;
}

.save-bar {
	display: flex;
	justify-content: flex-end;
	padding: 8px 0;
	border-top: 1px solid #e8e8e8;
}
</style>
