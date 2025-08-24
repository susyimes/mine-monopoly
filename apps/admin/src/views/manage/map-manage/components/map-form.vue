<script setup lang="ts">
import { createGameMap } from "@/utils/api/game-map";
import { GameMapInDb } from "@fatpaper-monopoly/types";
import { FormInstance, message, UploadChangeParam, UploadFile, UploadProps } from "ant-design-vue";
import { reactive, ref } from "vue";

const formRef = ref<FormInstance>();
const visible = defineModel();
const props = defineProps<{ gameMap: GameMapInDb | undefined }>();

const gameMapfileList = ref<UploadProps["fileList"]>([]);
const formValue = reactive<{ name: string; file: UploadFile | undefined }>({
	name: "",
	file: undefined,
});

function selectFileChange(info: UploadChangeParam) {
	formValue.file = info.file;
}

async function onFinish() {
	const formData = new FormData();
	// console.log("🚀 ~ onFinish ~ formValue.file:", formValue.file);
	if (!formValue.file || !formValue.file.originFileObj) {
		message.error("获取文件时错误");
		return;
	}
	formData.append("game-map", formValue.file.originFileObj);
	formData.append("name", formValue.name);
	await createGameMap(formData);
	message.success("上传地图成功");
}
</script>

<template>
	<a-form :model="formValue" @finish="onFinish" ref="formRef">
		<a-form-item label="地图名称" name="name" :rules="[{ required: true, message: '请输入地图名称' }]">
			<a-input v-model:value="formValue.name"></a-input>
		</a-form-item>
		<a-form-item label="地图文件" name="file" :rules="[{ required: true, message: '请选择地图文件' }]">
			<a-upload
				@change="selectFileChange"
				accept=".fpmap"
				v-model:file-list="gameMapfileList"
				:max-count="1"
				:customRequest="() => {}"
			>
				<template #itemRender="{ fileList }">
					<div class="file-item" v-for="file in fileList">{{ file.name }}</div>
				</template>
				<a-button>选择地图文件</a-button>
			</a-upload>
		</a-form-item>
		<a-form-item>
			<a-button style="float: right" type="primary" html-type="submit">添加</a-button>
		</a-form-item>
	</a-form>
</template>

<style lang="scss" scoped></style>
