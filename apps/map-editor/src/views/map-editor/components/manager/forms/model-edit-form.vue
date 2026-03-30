<script setup lang="ts">
import { addNewModel, updateExistingModel } from "@src/utils/file";
import { ModelPreviewerRenderer } from "@src/utils/three/ModelPreviewerRenderer";
import { ResourcePicker } from "@src/components/resource-picker";
import { reactive, watch, nextTick } from "vue"; // 引入 watch, nextTick
import { useResourceStore } from "@src/stores"; // 引入 store 获取回显数据
import { message } from "ant-design-vue";

interface FormState {
	name: string;
	modelId: string;
	tempFilePath?: string; // 临时存储选择的文件路径（编辑模式用）
}

// 接收一个可选的 editModelId，如果有值则是编辑模式
const props = defineProps<{
	editModelId?: string;
}>();

const createModelFrom = reactive<FormState>({
	name: "",
	modelId: "",
});

const visible = defineModel({ default: false });
let modelPreviewer: ModelPreviewerRenderer | null;
const resourceStore = useResourceStore();

// 监听弹窗打开，处理回显
watch(visible, async (isOpen) => {
	if (isOpen) {
		if (props.editModelId) {
			// --- 编辑模式：回填数据 ---
			const target = resourceStore.findModelById(props.editModelId);
			if (target) {
				createModelFrom.name = target.name;
				createModelFrom.modelId = target.id;
				// 等待 DOM 渲染后加载预览
				await nextTick();
				initPreviewer();
				await modelPreviewer?.loadModel(target.url, true);
			}
		} else {
			// --- 新增模式：重置 ---
			resetForm();
		}
	} else {
		handleClose();
	}
});

function initPreviewer() {
	if (!modelPreviewer) {
		const canvasContainer = document.querySelector("#form-preview-canvas-container") as HTMLDivElement;
		if (canvasContainer) {
			modelPreviewer = new ModelPreviewerRenderer(canvasContainer);
		}
	}
}

function handleResourceChange(resource: any) {
	// 保存选择的文件路径（autoSave: false 模式）
	if (resource && resource.url) {
		createModelFrom.tempFilePath = resource.url;
	}
}

async function handleConfirm() {
	const resourceStore = useResourceStore();

	if (props.editModelId) {
		// 编辑模式
		if (createModelFrom.modelId !== props.editModelId || createModelFrom.tempFilePath) {
			// 用户更换了模型文件（有 tempFilePath 说明是在 autoSave: false 模式下选择的文件）
			if (createModelFrom.tempFilePath) {
				// autoSave: false 模式：需要手动保存文件
				await updateExistingModel(props.editModelId, createModelFrom.name, createModelFrom.tempFilePath);
			} else {
				// autoSave: true 模式（虽然不应该发生）：从 store 获取新模型
				const newModel = resourceStore.findModelById(createModelFrom.modelId);
				if (newModel) {
					await updateExistingModel(props.editModelId, createModelFrom.name, newModel.url);
					resourceStore.removeModel(createModelFrom.modelId);
				}
			}
			createModelFrom.modelId = props.editModelId;
		} else {
			// 用户只更新了名称，没有更换模型
			const oldModel = resourceStore.findModelById(props.editModelId);
			if (oldModel) {
				oldModel.name = createModelFrom.name;
			}
		}
		message.success(`编辑模型 "${createModelFrom.name}" 成功`, 1);
	} else {
		// 新增模式
		if (createModelFrom.tempFilePath) {
			// autoSave: false 模式：需要手动保存
			await addNewModel(createModelFrom.tempFilePath, createModelFrom.name);
		} else {
			// autoSave: true 模式：只需更新名称
			const model = resourceStore.findModelById(createModelFrom.modelId);
			if (model) {
				model.name = createModelFrom.name;
			}
		}
		message.success(`添加模型 "${createModelFrom.name}" 成功`, 1);
	}
	visible.value = false;
}

function resetForm() {
	createModelFrom.name = "";
	createModelFrom.modelId = "";
	createModelFrom.tempFilePath = undefined;
}

function handleClose() {
	resetForm();
	modelPreviewer?.destroy();
	modelPreviewer = null;
}
</script>

<template>
	<a-modal
		destroyOnClose
		:footer="null"
		width="30%"
		v-model:open="visible"
		:title="props.editModelId ? '编辑模型' : '添加模型'"
	>
		<a-form @finish="handleConfirm" :model="createModelFrom" name="basic" autocomplete="off">
			<a-form-item label="模型名称" name="name" :rules="[{ required: true, message: '请输入模型名称' }]">
				<a-input v-model:value="createModelFrom.name" />
			</a-form-item>

			<a-form-item label="模型地址" name="modelId" :rules="[{ required: true, message: '请选择模型' }]">
				<!-- 旧的模型预览容器（用于编辑模式） -->
				<div id="form-preview-canvas-container" class="model-preview-canvas-container"></div>
				<div style="color: #999; font-size: 12px; margin-bottom: 8px;">↑ 旧预览（编辑模式回显）</div>

				<!-- 新的 ResourcePicker 组件 -->
				<ResourcePicker
					type="model"
					v-model="createModelFrom.modelId"
					:auto-save="!props.editModelId"
					@change="handleResourceChange"
				/>
				<div style="color: #999; font-size: 12px; margin-top: 8px;">↑ 新预览（ResourcePicker）</div>
			</a-form-item>

			<a-form-item>
				<a-button style="float: right" type="primary" html-type="submit">
					{{ props.editModelId ? "保存修改" : "添加" }}
				</a-button>
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<style lang="scss" scoped>
.model-preview-canvas-container {
	display: block;
	margin-bottom: 10px;
	border-radius: 10px;
	width: 100%;
	height: 150px;
	border-radius: 5px;
	background-color: #f3f3f3;
	overflow: hidden;
	position: relative; /* 确保 canvas 能够正确适应 */
}
</style>
