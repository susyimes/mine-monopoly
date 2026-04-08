import * as THREE from "three";
import { createApp } from "vue";
import { ChanceCard } from "@mine-monopoly/ui";
import html2canvas from "html2canvas";
import { ChanceCardInfo } from "@mine-monopoly/types";

/**
 * 机会卡纹理生成器
 * 职责：将Vue组件渲染为Canvas纹理
 */
export class ChanceCardTextureGenerator {
	private static textureCache = new Map<string, THREE.CanvasTexture>();
	private static renderContainer: HTMLDivElement | null = null;
	private static MAX_CACHE_SIZE = 50;
	private static iconCache = new Map<string, HTMLImageElement>();

	/**
	 * 生成机会卡纹理
	 */
	static async generateTexture(
		card: ChanceCardInfo,
		iconUrl: string
	): Promise<THREE.CanvasTexture> {
		const cacheKey = `${card.id}_${card.iconId}`;

		// 检查缓存
		if (this.textureCache.has(cacheKey)) {
			return this.textureCache.get(cacheKey)!;
		}

		try {
			// 1. 创建并挂载Vue组件
			const container = this.ensureRenderContainer();
			const canvas = await this.renderComponentToCanvas(container, card, iconUrl);

			// 2. 创建Three.js纹理
			const texture = new THREE.CanvasTexture(canvas);
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;

			// 3. 缓存纹理
			this.textureCache.set(cacheKey, texture);

			return texture;
		} catch (error) {
			console.error("[ChanceCardTextureGenerator] 生成纹理失败:", error);
			throw error;
		}
	}

	/**
	 * 初始化渲染容器（隐藏的DOM节点）
	 */
	private static ensureRenderContainer(): HTMLDivElement {
		if (!this.renderContainer) {
			this.renderContainer = document.createElement("div");
			this.renderContainer.style.position = "absolute";
			this.renderContainer.style.top = "-9999px";
			this.renderContainer.style.left = "-9999px";
			this.renderContainer.style.zIndex = "-1";
			this.renderContainer.style.pointerEvents = "none";
			document.body.appendChild(this.renderContainer);
		}
		return this.renderContainer;
	}

	/**
	 * 渲染Vue组件到Canvas
	 */
	private static async renderComponentToCanvas(
		container: HTMLDivElement,
		card: ChanceCardInfo,
		iconUrl: string
	): Promise<HTMLCanvasElement> {
		return new Promise((resolve, reject) => {
			// 1. 创建Vue应用实例
			const app = createApp(ChanceCard, {
				chanceCard: card,
				iconUrl: iconUrl,
				disable: true,
			});

			// 2. 挂载到容器
			const wrapper = document.createElement("div");
			// ⭐ 获取实际的 rem 像素值
			const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

			// ⭐ 关键修复：在 wrapper 上设置正确的 font-size，确保 rem 使用正确的基准值
			wrapper.style.fontSize = `${rootFontSize}px`;

			// ⭐ 根据组件实际尺寸设置 wrapper 大小（11em × 14em）
			wrapper.style.width = `${11 * rootFontSize}px`;
			wrapper.style.height = `${14 * rootFontSize}px`;
			wrapper.style.position = "relative";

			// ⭐ 使用flex布局确保组件完全居中
			wrapper.style.display = "flex";
			wrapper.style.justifyContent = "center";
			wrapper.style.alignItems = "center";
			wrapper.style.margin = "0";
			wrapper.style.padding = "0";
			wrapper.style.overflow = "hidden";
			wrapper.style.boxSizing = "border-box";

			container.appendChild(wrapper);

			const instance = app.mount(wrapper);

			// 3. 等待组件完全渲染（包括图片加载）
			requestAnimationFrame(async () => {
				try {
					// 额外等待确保图片加载完成
					await this.waitForImages(wrapper);

					// 4. 使用html2canvas转换为Canvas
					const canvas = await html2canvas(wrapper, {
						backgroundColor: null,
						scale: 2, // ⭐ 降低scale到2倍（因为wrapper已经使用正确的rem尺寸）
						logging: false,
						useCORS: true, // 支持跨域图片
						allowTaint: false,
						// ⭐ 添加更多选项确保正确渲染
						x: 0,           // canvas x坐标
						y: 0,           // canvas y坐标
						width: wrapper.clientWidth,   // 使用wrapper的实际宽度
						height: wrapper.clientHeight, // 使用wrapper的实际高度
					});

					// 5. 清理DOM
					app.unmount();
					container.removeChild(wrapper);

					resolve(canvas);
				} catch (error) {
					// 清理DOM
					app.unmount();
					if (container.contains(wrapper)) {
						container.removeChild(wrapper);
					}
					reject(error);
				}
			});
		});
	}

	/**
	 * 等待图片加载完成
	 */
	private static waitForImages(element: HTMLElement): Promise<void> {
		const images = element.querySelectorAll("img");
		const promises = Array.from(images).map((img) => {
			if (img.complete) {
				return Promise.resolve();
			}
			return new Promise<void>((resolve) => {
				img.onload = () => resolve();
				img.onerror = () => resolve(); // 即使失败也继续
				// 超时保护
				setTimeout(() => resolve(), 1000);
			});
		});
		return Promise.all(promises).then(() => {});
	}

	/**
	 * 预加载所有图标图片到浏览器缓存
	 * 后续渲染时 waitForImages 中的 img.complete 会直接为 true，消除超时等待
	 */
	static preloadIcons(iconUrls: string[]): Promise<void> {
		const uniqueUrls = [...new Set(iconUrls.filter(Boolean))];
		const promises = uniqueUrls.map(url => {
			if (this.iconCache.has(url)) return Promise.resolve();
			return new Promise<void>((resolve) => {
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.onload = () => {
					this.iconCache.set(url, img);
					resolve();
				};
				img.onerror = () => resolve();
				img.src = url;
			});
		});
		return Promise.all(promises).then(() => {});
	}

	/**
	 * 并发预加载纹理，带进度回调
	 * @param cards - 机会卡数据数组
	 * @param concurrency - 最大并发数（默认4）
	 * @param onProgress - 进度回调 (已完成数, 总数, 卡名)
	 */
	static async preloadTexturesConcurrent(
		cards: Array<{ card: ChanceCardInfo; iconUrl: string }>,
		concurrency: number = 4,
		onProgress?: (completed: number, total: number, cardName: string) => void
	): Promise<void> {
		const total = cards.length;
		let completed = 0;
		let index = 0;

		const self = this;

		async function processNext(): Promise<void> {
			while (index < cards.length) {
				const currentIndex = index++;
				const { card, iconUrl } = cards[currentIndex];

				try {
					await self.generateTexture(card, iconUrl);
					console.log(`[ChanceCardTextureGenerator] 预加载进度: ${completed + 1}/${total} - ${card.name}`);
				} catch (error) {
					console.error(`[ChanceCardTextureGenerator] 预加载失败: ${card.name}`, error);
				}

				completed++;
				onProgress?.(completed, total, card.name);
			}
		}

		const workers = Array.from(
			{ length: Math.min(concurrency, total) },
			() => processNext()
		);
		await Promise.all(workers);

		console.log(`[ChanceCardTextureGenerator] 预加载 ${total} 个纹理完成`);
	}

	/**
	 * 清理纹理缓存
	 */
	static clearCache() {
		this.textureCache.forEach((texture) => {
			texture.dispose();
		});
		this.textureCache.clear();
		this.iconCache.clear();

		// 清理渲染容器
		if (this.renderContainer && document.body.contains(this.renderContainer)) {
			document.body.removeChild(this.renderContainer);
			this.renderContainer = null;
		}
	}
}
