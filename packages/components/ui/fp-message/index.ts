type MessageOptions = {
	type: "info" | "success" | "warning" | "error";
	message: string;
	onClosed?: Function;
	delay?: number;
};

import fpMessageVue from "./fp-message.vue";
import { App, ComponentPublicInstance, createApp, ref, watch, WatchStopHandle, nextTick } from "vue";

// 扩展类型定义
interface FPMessageInstance extends ComponentPublicInstance {
	setVisible: (visible: boolean) => Promise<void>;
	setTop: (top: number) => void;
	getHeightPx: () => number;
}

let itemQueue = ref([] as Array<FPMessageInstance>);

function FPMessage(options: MessageOptions) {
	const fpMessage = createApp(fpMessageVue, options);
	showMessage(fpMessage, options.delay || 3000, options.onClosed);
}

function showMessage(app: App, delay: number, onClosedFn: Function | undefined) {
	const container = document.createDocumentFragment();
	const vm = app.mount(container) as FPMessageInstance;
	itemQueue.value.push(vm);

	const targetDocument = document.querySelector("#fpmessage-container") || document.body;
	targetDocument.appendChild(container);

	// 等待 DOM 渲染后计算位置
	nextTick(() => {
		updatePositions();
		vm.setVisible(true);
	});

	const stopHandle = watch(
		itemQueue,
		() => {
			// 队列变化时重新计算
			nextTick(() => {
				updatePositions();
			});
		},
		{ deep: true },
	);

	let timer: any = setTimeout(async () => {
		await hideMessage(app, vm, stopHandle);
		if (onClosedFn) onClosedFn();
		clearTimeout(timer);
		timer = -1;
	}, delay);
}

const hideMessage = async (app: App, vm: FPMessageInstance, stopHandle: WatchStopHandle) => {
	await vm.setVisible(false);
	stopHandle();
	app.unmount();
	itemQueue.value = itemQueue.value.filter((item) => item !== vm);
};

// 获取当前 1rem 对应的像素值
function getRemBase() {
	if (typeof window === "undefined") return 16;
	// 获取 html 根元素的 fontSize
	const fontSize = getComputedStyle(document.documentElement).fontSize;
	return parseFloat(fontSize) || 16;
}

// 核心计算逻辑
function updatePositions() {
	const remBase = getRemBase(); // 获取当前的 rem 基准值
	const startTop = 1.2; // 起始距离 (rem)
	const gap = 1.2; // 间距 (rem)

	let currentTop = startTop;

	itemQueue.value.forEach((vm) => {
		// 设置当前元素的 top (rem)
		vm.setTop(currentTop);

		// 计算当前元素的高度 (转换 px -> rem)
		const heightPx = vm.getHeightPx();
		const heightRem = heightPx / remBase;

		// 累加：当前位置 + 元素高度 + 间距
		currentTop += heightRem + gap;
	});
}

export default FPMessage;
