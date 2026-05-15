import type { Ref } from "vue";
import type * as monaco from "monaco-editor";

export function useMonacoTypeLibs(monacoInstance: Ref<typeof monaco | null>) {
	function refreshTypeLibs(options: {
		staticTypes?: string;
		extraLibs?: string;
		uiTemplates?: any[];
		gameSettingForm?: any[];
		modifierTemplates?: any[];
	}) {
		if (!monacoInstance.value) return;

		const tsDefaults = monacoInstance.value.languages.typescript.typescriptDefaults;
		const libs: { content: string; filePath: string }[] = [];

		// 1. 组件静态类型
		if (options.staticTypes) {
			libs.push({
				content: options.staticTypes,
				filePath: "file:///static-types.d.ts",
			});
		}

		// 2. 全局额外类型库
		if (options.extraLibs) {
			libs.push({
				content: options.extraLibs,
				filePath: "file:///extra-libs.d.ts",
			});
		}

		// 3. 动态 UI 模板类型
		if (options.uiTemplates && options.uiTemplates.length > 0) {
			const declarations = options.uiTemplates
				.map(
					(ui) => `
    /**
     * **组件名称**: ${ui.name}\n
     * **slug**: ${ui.slug}
     * * ID: \`${ui.id}\`
     */
    const $ui__${ui.slug}: UISchema;
  `,
				)
				.join("\n");

			libs.push({
				content: `
    declare global {
      ${declarations}
    }
    export {};
  `,
				filePath: "file:///ui-templates.d.ts",
			});
		}

		// 4. 动态游戏设置类型
		if (options.gameSettingForm && options.gameSettingForm.length > 0) {
			const declarations = options.gameSettingForm
				.map((setting: any) => {
					const valueType = setting.type === 'number-input'
						? 'number'
						: 'string | number';
					return `    /** ${setting.label} */
    ${setting.key}: { label: string; value: ${valueType}; displayValue: ${valueType} };`;
				})
				.join("\n");

			libs.push({
				content: `
    declare global {
      interface GameSetting {
        ${declarations}
      }
    }
    export {};
  `,
				filePath: "file:///game-settings.d.ts",
			});
		}

		// 5. 动态 Modifier 模板类型
		if (options.modifierTemplates && options.modifierTemplates.length > 0) {
			const declarations = options.modifierTemplates
				.map(
					(mod) => `
    /**
     * **修饰器名称**: ${mod.name}
     * **slug**: ${mod.slug}
     * ID: \`${mod.id}\`
     */
    const $mod__${mod.slug}: ModifierTemplate;
  `,
				)
				.join("\n");

			libs.push({
				content: `
    declare global {
      ${declarations}
    }
    export {};
  `,
				filePath: "file:///modifier-templates.d.ts",
			});
		}

		tsDefaults.setExtraLibs(libs);
	}

	return { refreshTypeLibs };
}
