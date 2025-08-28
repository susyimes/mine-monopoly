<script setup lang="ts">
import libContent from "./editor-lib.d.ts?raw";
import templateText from "./template-text?raw";
import CodeEditor from "@src/components/code-editor/index.vue";

const effectCode = defineModel<string | undefined>();
</script>

<template>
	<div class="editor-container">
		<code-editor v-model="effectCode" :template-text="templateText" :extra-libs="[libContent]" />
	</div>
</template>

<style lang="scss" scoped>
.editor-container {
	width: 100%;
	height: 70vh;
}
</style>
