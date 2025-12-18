<script setup lang="ts">
import { computed } from "vue";
import { evalExpression, parseVFor } from "./utils";
import { UISchema } from "@fatpaper-monopoly/types";

const props = defineProps<{
	schema: UISchema;
	context: Record<string, any>;
}>();

// --- 核心修复：判断是否为 SVG 文本节点 ---
// 如果 type 是 'text' 且 props 里包含了 SVG 特有的坐标属性 x 或 y，
// 则认为是 SVG 文本，不应该渲染为 span。
const isSvgText = computed(() => {
	if (props.schema.type !== "text") return false;
	const p = props.schema.props || {};
	// 检查是否存在 x 或 y 属性 (SVG <text> 必有其一用于定位)
	return p.x !== undefined || p.y !== undefined;
});

// 1. 处理 v-show
const shouldShow = computed(() => {
	if (!props.schema.vShow) return true;
	return !!evalExpression(props.context, props.schema.vShow);
});

// 2. 处理文本绑定
const textContent = computed(() => {
	if (props.schema.textBinding) {
		const val = evalExpression(props.context, props.schema.textBinding);
		return val !== null && val !== undefined ? String(val) : "";
	}
	return props.schema.content || "";
});

// 3. 处理样式绑定
const computedStyle = computed(() => {
	const styles: Record<string, string> = { ...props.schema.style };

	if (props.schema.styleBinding) {
		Object.entries(props.schema.styleBinding).forEach(([cssProp, expr]) => {
			const val = evalExpression(props.context, expr);
			if (val !== undefined && val !== null) {
				styles[cssProp] = String(val);
			}
		});
	}
	return styles;
});

// 4. 处理 Props 绑定
const computedProps = computed(() => {
	const finalProps: Record<string, any> = { ...props.schema.props };

	if (props.schema.propsBinding) {
		Object.entries(props.schema.propsBinding).forEach(([key, expr]) => {
			const val = evalExpression(props.context, expr);
			if (val !== undefined && val !== null) {
				finalProps[key] = val;
			}
		});
	}
	return finalProps;
});

// 5. v-for 列表获取
const getList = (vForExpr: string) => {
	const { listExpr } = parseVFor(vForExpr);
	if (!listExpr) return [];
	const list = evalExpression(props.context, listExpr);
	return Array.isArray(list) ? list : [];
};

const getItemContext = (vForExpr: string, itemValue: any, index: number) => {
	const { itemKey } = parseVFor(vForExpr);
	return {
		...props.context,
		[itemKey]: itemValue,
		index,
	};
};
</script>

<template>
	<template v-if="schema.type === 'text' && !isSvgText">
		<span v-if="shouldShow" :style="computedStyle">
			{{ textContent }}
		</span>
	</template>

	<component v-else :is="schema.type" v-show="shouldShow" v-bind="computedProps" :style="computedStyle">
		{{ textContent }}

		<template v-for="child in schema.children" :key="child.id">
			<template v-if="child.vFor">
				<UiRenderer
					v-for="(item, index) in getList(child.vFor)"
					:key="child.id + '-' + index"
					:schema="child"
					:context="getItemContext(child.vFor, item, index)"
				/>
			</template>

			<UiRenderer v-else :schema="child" :context="context" />
		</template>
	</component>
</template>
