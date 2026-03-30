<script setup lang="ts">
import { useMapDataStore, useResourceStore } from "@src/stores";
import { RolePreviewerRenderer } from "@src/utils/three/RolePreviewerRenderer";
import { message } from "ant-design-vue";
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from "vue";
import CodeEditor from "@src/components/code-editor/index.vue";
import libContent from "./editor-lib.d.ts?raw";
import templateText from "./template-text?raw";
import { Role } from "@mine-monopoly/types";
import { ResourcePicker } from "@src/components/resource-picker";

const { role } = defineProps<{ role: Role | undefined }>();

// 使用 ref 代替 querySelector，更符合 Vue 规范且防止 ID 冲突
const canvasContainerRef = ref<HTMLDivElement>();
let rolePreviewer: RolePreviewerRenderer | null = null;

onMounted(async () => {
	if (role) {
		roleForm.id = role.id;
		roleForm.name = role.name;
		roleForm.description = role.description;
		roleForm.color = role.color;
		roleForm.initCode = role.initCode;
		roleForm.imageId = role.imageId;
		await loadRole(role.imageId);
	}
});

interface FormState {
	id: string;
	name: string;
	description: string;
	color: string;
	imageId: string;
	initCode: string;
}
const roleForm = reactive<FormState>({
	id: "",
	name: "",
	description: "",
	color: "#000000",
	imageId: "",
	initCode: "",
});

const emits = defineEmits(["submit"]);

function handleSubmit() {
	if (role) {
		handleEditRole();
	} else {
		handleCreateRole();
	}
}

async function handleEditRole() {
	try {
		if (!role) return;
		const _role = {
			id: role.id,
			name: roleForm.name,
			description: roleForm.description,
			color: roleForm.color,
			imageId: roleForm.imageId,
			initCode: roleForm.initCode,
		};
		useMapDataStore().editRole(_role);
		message.success(`编辑角色 "${_role.name}" 成功`, 1);
		emits("submit");
	} catch (e: any) {
		message.error(e.message, 1);
	}
}

async function handleCreateRole() {
	try {
		const role = {
			id: `role-${crypto.randomUUID()}`,
			name: roleForm.name,
			description: roleForm.description,
			color: roleForm.color,
			imageId: roleForm.imageId,
			initCode: roleForm.initCode,
		};
		useMapDataStore().addRole(role);
		message.success(`添加角色 "${role.name}" 成功`, 1);
		emits("submit");
	} catch (e: any) {
		message.error(e.message, 1);
	}
}

async function loadRole(imageId: string) {
	if (!rolePreviewer) {
		// 使用 ref 获取容器
		if (canvasContainerRef.value) {
			rolePreviewer = new RolePreviewerRenderer(canvasContainerRef.value);
		}
	}
	const resource = useResourceStore().findImageById(imageId);
	if (!resource) {
		message.error("获取角色资源失败");
		return;
	}
	await rolePreviewer?.loadRole(resource.url);
}

onBeforeUnmount(handleClose);

// Watch for imageId changes to update preview
watch(() => roleForm.imageId, async (newImageId) => {
	if (newImageId) {
		await loadRole(newImageId);
	}
});

function handleClose() {
	roleForm.name = "";
	roleForm.imageId = "";
	rolePreviewer?.destroy();
	rolePreviewer = null;
}
</script>

<template>
	<div class="role-form-container">
		<div class="role-form">
			<div class="form-content">
				<a-form @finish="handleSubmit" :model="roleForm" name="basic" autocomplete="off">
					<a-form-item label="ID">
						<a-alert style="word-break: break-all" :message="roleForm.id" type="info" />
					</a-form-item>

					<a-form-item label="角色名称" name="name" :rules="[{ required: true, message: '请输入角色名称' }]">
						<a-input v-model:value="roleForm.name" />
					</a-form-item>

					<a-form-item label="角色描述" name="description" :rules="[{ required: true, message: '请输入角色描述' }]">
						<a-textarea v-model:value="roleForm.description" :auto-size="{ minRows: 4, maxRows: 6 }" />
					</a-form-item>

					<a-form-item label="代表颜色" name="color" :rules="[{ required: true, message: '请输入代表颜色' }]">
						<input type="color" v-model="roleForm.color" />
					</a-form-item>

					<a-form-item label="角色预览" name="imageId" :rules="[{ required: true, message: '请选择角色图片' }]">
						<!-- 旧的角色预览容器（3D纸片人预览） -->
						<div ref="canvasContainerRef" class="model-preview-canvas-container"></div>
						<div style="color: #999; font-size: 12px; margin-bottom: 8px;">↑ 旧预览（3D纸片人）</div>

						<!-- 新的 ResourcePicker 组件 -->
						<ResourcePicker
							type="image"
							v-model="roleForm.imageId"
						/>
						<div style="color: #999; font-size: 12px; margin-top: 8px;">↑ 新预览（ResourcePicker）</div>
					</a-form-item>
				</a-form>
			</div>
			<div class="footer-actions">
				<a-button type="primary" block @click="handleSubmit">
					{{ role ? '保存修改' : '创建角色' }}
				</a-button>
			</div>
		</div>
		<div class="editor-container">
			<span class="title">
				<a-alert message="在下面编辑器编写角色代码，在玩家初始化时会执行" type="info" show-icon />
			</span>
			<code-editor v-model="roleForm.initCode" :template-text="templateText" :static-types="libContent" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.role-form-container {
	display: flex;
	height: 75vh;

	.role-form {
		width: 25vw;
		display: flex;
		flex-direction: column;
		padding-right: 10px;

		.form-content {
			flex: 1;
			overflow-y: auto;
		}

		.footer-actions {
			flex-shrink: 0;
			padding: 12px 0;
			border-top: 1px solid #f0f0f0;
			background: #fff;
		}
	}

	.editor-container {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 0 10px;
		gap: 10px;
	}
}
.role-image-url {
	display: block;
	margin-bottom: 10px;
	padding: 5px;
	border: 1px solid #ccc;
	border-radius: 5px;
	background-color: #f3f3f3;
	word-break: break-all;
}
.model-preview-canvas-container {
	display: block;
	margin-bottom: 10px;
	border-radius: 10px;
	width: 100%;
	height: 150px;
	border-radius: 5px;
	background-color: #f3f3f3;
	overflow: hidden;
}
</style>
