<script setup lang="ts">
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import { ModifierTemplate } from "@mine-monopoly/types";
import { useMapDataStore } from "@src/stores";
import { generateShortId } from "@src/utils/short-id";
import ModifierTemplateEditor from "./form/modifier-template-editor.vue";

const mapStore = useMapDataStore();
const model = defineModel<boolean>({ default: false });

// 状态定义
const editorVisible = ref(false);
const currentTemplate = ref<ModifierTemplate | null>(null);
const isEditing = computed(() => !!currentTemplate.value?.id && mapStore.modifierTemplates.some(t => t.id === currentTemplate.value!.id));

const sortedTemplates = computed(() =>
	[...mapStore.modifierTemplates].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
);

const commandTypeLabels: Record<string, string> = {
	"player.money.gain": "玩家获得金钱",
	"player.money.lose": "玩家失去金钱",
	"player.walk": "玩家行走",
	"player.tp": "玩家传送",
	"player.dice.roll": "玩家掷骰子",
	"player.dice.add": "玩家添加骰子",
	"player.dice.remove": "玩家移除骰子",
	"player.property.gain": "玩家获得地产",
	"player.property.lose": "玩家失去地产",
	"player.card.gain": "玩家获得机会卡",
	"player.card.lose": "玩家失去机会卡",
	"player.stop": "设置停止回合数",
	"player.round.start": "玩家回合开始",
	"player.round.end": "玩家回合结束",
	"player.round.skip": "玩家回合跳过",
	"player.bankrupted.set": "设置破产状态",
	"property.owner.change": "地产主人变更",
	"property.level.up": "地产升级",
	"property.level.down": "地产降级",
	"property.level.set": "地产等级设置",
	"property.arrived": "玩家到达地产",
};

/**
 * 新建修饰器模板
 */
function handleCreate() {
	const newTemplate: ModifierTemplate = {
		id: generateShortId("mod"),
		name: "新修饰器_" + Math.floor(Math.random() * 1000),
		slug: "",
		descriptor: {
			timing: "before",
			commandType: "",
			remainingTriggers: -1,
			priority: 0,
			autoConsume: true,
		},
		effectCode: "",
	};
	currentTemplate.value = newTemplate;
	editorVisible.value = true;
}

/**
 * 编辑修饰器模板
 */
function handleEdit(template: ModifierTemplate) {
	currentTemplate.value = JSON.parse(JSON.stringify(template));
	editorVisible.value = true;
}

/**
 * 删除修饰器模板
 */
function handleDelete(id: string) {
	mapStore.removeModifierTemplate(id);
	message.success("修饰器模板已删除");
}

/**
 * 保存修饰器模板
 */
function handleSave(template: ModifierTemplate) {
	mapStore.saveModifierTemplate(template);
	message.success("修饰器模板保存成功");
	closeEditor();
}

/**
 * 复制模板标识符
 */
async function copyModSlug(slug: string) {
	const text = `$mod__${slug}`;
	await navigator.clipboard.writeText(text);
	message.success(`已复制: ${text}`);
}

function closeEditor() {
	editorVisible.value = false;
	currentTemplate.value = null;
}
</script>

<template>
	<a-modal
		v-model:open="model"
		title="修饰器模板管理器"
		width="100%"
		destroyOnClose
		:footer="null"
		wrap-class-name="modifier-template-manager-container"
	>
		<div class="manager-layout">
			<div class="library-view custom-scrollbar">
				<div class="library-header">
					<span>共 {{ mapStore.modifierTemplates.length }} 个修饰器模板</span>
					<a-button type="primary" @click="handleCreate"> + 新建修饰器 </a-button>
				</div>

				<div class="card-grid">
					<div v-for="item in sortedTemplates" :key="item.id" class="schema-card">
						<div class="card-info">
							<div class="card-name">{{ item.name }}</div>
							<div class="card-slug">{{ `$mod__${item.slug}` }}</div>
							<div class="card-meta">
								<span class="tag" :class="item.descriptor.timing">{{ item.descriptor.timing }}</span>
								<span class="command-type">{{ commandTypeLabels[item.descriptor.commandType] || item.descriptor.commandType || "未设置" }}</span>
							</div>
							<div class="card-id">ID: {{ item.id }}</div>
						</div>
						<div class="card-actions">
							<a-button size="small" @click="copyModSlug(item.slug)" :disabled="!item.slug">复制标识</a-button>
							<a-button size="small" @click="handleEdit(item)">编辑</a-button>
							<a-button size="small" danger @click="handleDelete(item.id)">删除</a-button>
						</div>
					</div>
					<div v-if="mapStore.modifierTemplates.length === 0" class="empty-state">暂无修饰器模板，请点击上方按钮创建</div>
				</div>
			</div>
		</div>
	</a-modal>

	<a-modal
		v-model:open="editorVisible"
		:title="isEditing ? '编辑修饰器模板' : '新建修饰器模板'"
		width="100%"
		centered
		destroyOnClose
		:footer="null"
		:mask-closable="false"
		class="editor-modal"
	>
		<ModifierTemplateEditor
			v-if="currentTemplate"
			:data="currentTemplate"
			@save="handleSave"
			@cancel="closeEditor"
		/>
	</a-modal>
</template>

<style lang="scss">
.modifier-template-manager-container {
	.ant-modal {
		max-width: 96vw;
		top: 5vh;
		padding-bottom: 0;
	}
	.ant-modal-content {
		display: flex;
		flex-direction: column;
		height: 90vh;
		overflow: hidden;
	}
	.ant-modal-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 0;
	}
}

.manager-layout {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
	border-radius: 10px;
}

.library-view {
	flex: 1;
	padding: 24px;
	overflow-y: auto;
	background: #f5f5f5;
}

.library-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	font-weight: bold;
	color: #666;
}

.card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 16px;
}

.schema-card {
	background: #fff;
	border-radius: 8px;
	padding: 16px;
	border: 1px solid #e8e8e8;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.2s;
	&:hover {
		border-color: #1890ff;
	}
}

.card-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.card-name {
	font-weight: 600;
	font-size: 16px;
	margin-bottom: 2px;
}

.card-slug {
	font-size: 12px;
	color: #58afff;
	font-weight: 600;
}

.card-meta {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: #666;

	.tag {
		display: inline-block;
		padding: 1px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 600;

		&.before {
			background: #e6f7ff;
			color: #1890ff;
		}

		&.after {
			background: #f6ffed;
			color: #52c41a;
		}
	}

	.command-type {
		font-family: monospace;
	}
}

.card-id {
	font-size: 12px;
	color: #999;
	font-family: monospace;
}

.card-actions {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.empty-state {
	text-align: center;
	padding: 40px;
	color: #999;
}
</style>
