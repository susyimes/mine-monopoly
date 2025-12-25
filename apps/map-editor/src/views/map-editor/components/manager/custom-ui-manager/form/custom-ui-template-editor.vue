<script setup lang="ts">
import { ref } from "vue";
import { UITemplate } from "@fatpaper-monopoly/types";
import UiSchemaForm from "./ui-schema-form.vue"; // 递归编辑 UISchema 的组件

// 接收 UITemplate
const props = defineProps<{ data: UITemplate }>();
const emit = defineEmits(["save", "cancel"]);

// 本地深拷贝
const localData = ref<UITemplate>(JSON.parse(JSON.stringify(props.data)));

function handleSave() {
	if (!localData.value.name.trim()) {
		localData.value.name = "未命名组件";
	}
	emit("save", localData.value);
}
</script>

<template>
	<div class="template-editor-wrapper">
		<div class="editor-header">
			<div class="left">
				<span class="label">组件名称:</span>
				<a-input v-model:value="localData.name" placeholder="请输入组件名称" style="width: 240px" />
				<span class="id-tag">ID: {{ localData.id }}</span>
			</div>
			<div class="right">
				<a-button @click="$emit('cancel')" style="margin-right: 8px">取消</a-button>
				<a-button type="primary" @click="handleSave">保存组件</a-button>
			</div>
		</div>

		<div class="editor-body">
			<UiSchemaForm v-model="localData.template" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.template-editor-wrapper {
	display: flex;
	flex-direction: column;
	height: 80vh;
}
.editor-header {
	height: 60px;
	border-bottom: 1px solid #ddd;
	padding: 0 24px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #fff;
	flex-shrink: 0;

	.left {
		display: flex;
		align-items: center;
		gap: 12px;
		.label {
			font-weight: bold;
		}
		.id-tag {
			font-family: monospace;
			color: #999;
			background: #f5f5f5;
			padding: 2px 6px;
			border-radius: 4px;
			font-size: 12px;
		}
	}
}
.editor-body {
	flex: 1;
	overflow: hidden;
	padding: 16px;
	background: #f9f9f9;
}
</style>
