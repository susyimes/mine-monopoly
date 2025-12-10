<script setup lang="ts">
import { type CSSProperties } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

/**
 * Props 定义
 * 使用 defineModel 实现 visible 的双向绑定
 */
const visible = defineModel<boolean>("visible", { default: false });

const props = withDefaults(
	defineProps<{
		title?: string;
		closable?: boolean;
		submitDisable?: boolean;
		hiddenFooter?: boolean;
		style?: CSSProperties | string; // 兼容字符串和对象写法
		appendToBody?: boolean; // 可选：是否传送到 body
	}>(),
	{
		closable: true,
		submitDisable: false,
		hiddenFooter: false,
		style: "",
		appendToBody: true,
	}
);

const emits = defineEmits<{
	(e: "submit"): void;
	(e: "cancel"): void;
}>();

function handleSubmit() {
	emits("submit");
	visible.value = false;
}

function closeDialog() {
	if (!props.closable) return;
	emits("cancel");
	visible.value = false;
}
</script>

<template>
	<Teleport to="body" :disabled="!appendToBody">
		<Transition name="dialog-fade">
			<div class="fp-dialog" v-if="visible">
				<div class="fp-dialog-modal" @click="closeDialog"></div>

				<div class="fp-dialog-main" :style="props.style">
					<div class="fp-dialog-header">
						<div class="title">
							<span v-if="title">{{ title }}</span>
							<slot v-else name="title">默认标题</slot>
						</div>
						<button v-if="closable" class="close-button btn-small" @click="closeDialog">
							<FontAwesomeIcon icon="close" />
						</button>
					</div>

					<div class="fp-dialog-body">
						<slot></slot>
					</div>

					<div class="fp-dialog-footer" v-if="!hiddenFooter">
						<button :disabled="submitDisable" @click="handleSubmit">确认</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style lang="scss" scoped>
@import "@src/assets/variables.scss";

.fp-dialog {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: var(--z-dialog, 2000); // 给个默认值防止变量未定义
	display: flex;
	align-items: center;
	justify-content: center;
	// 移除 transition: 0.3s; 应该由 Vue Transition 组件控制
	pointer-events: initial;
	box-sizing: border-box;

	.fp-dialog-modal {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%; // 改为 100% 适应 Teleport 后的视口
		background-color: rgba(0, 0, 0, 0.5); //稍微加深一点遮罩
		user-select: none;
		pointer-events: auto;
	}

	.fp-dialog-main {
		@include felt-patch(var(--color-bg-light));

		min-width: 30em;
		// min-height: 20em;
		max-width: 90vw;
		max-height: 80vh;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		z-index: 1; // 只需要比 modal 高即可
		pointer-events: initial;
	}

	.fp-dialog-header {
		height: 2rem;
		position: relative;

		.title {
			@include felt-patch(var(--color-third));
			position: absolute;
			top: -1.6rem;
			color: var(--color-text-white);
			text-shadow: var(--text-shadow);
			position: absolute;
			z-index: 10;
			transform: rotate(-1.8deg);
		}

		.close-button {
			width: 2rem;
			height: 2rem;
			font-size: 1rem;
			position: absolute;
			right: 0;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: var(--color-third);
		}
	}

	.fp-dialog-body {
		flex: 1;
		padding: 0.5rem 1.2em;
		overflow-y: auto;
	}

	.fp-dialog-footer {
		text-align: right;
		padding: 0.6rem;

		button {
			padding: 0.5em 1.2em;
			border-radius: 6px;
			font-size: 1rem;
			cursor: pointer;
			background-color: var(--color-third);
			color: white;
			border: none;
			transition: filter 0.2s;

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			&:not(:disabled):hover {
				filter: brightness(0.9);
			}
		}
	}
}

/* Vue Transition 动画样式 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
	transition: opacity 0.3s ease;

	.fp-dialog-main {
		transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
	}
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
	opacity: 0;

	.fp-dialog-main {
		transform: scale(0.9) translateY(-20px);
	}
}
</style>
