import { ChanceCardOperateType, ChanceCardType, GameEventType } from "@fatpaper-monopoly/types";
import { ChanceCardInfo } from "@fatpaper-monopoly/types";
import useEventBus from "@src/utils/event-bus";
import { App, createApp, createVNode, Directive, DirectiveBinding, DirectiveHook, toRaw, VNode } from "vue";
import ToSelf from "./components/change-card-target-selector/to-self.vue";
import ToProperty from "./components/change-card-target-selector/to-property.vue";
import ToMapitem from "./components/change-card-target-selector/to-mapitem.vue";
import ToOtherPlayer from "./components/change-card-target-selector/to-other-player.vue";
import ToPlayer from "./components/change-card-target-selector/to-player.vue";
import { useMonopolyClient } from "@src/core/monopoly-client/MonopolyClient";

const eventEmitter = useEventBus();

export const chanceCardSource: Directive = {
	mounted: cardUseModeClick
};

function cardUseModeClick(el: HTMLElement, binding: DirectiveBinding) {
	const chanceCard = toRaw(binding.value) as ChanceCardInfo;
	el.style.cursor = "pointer";

	el.addEventListener("click", (event: MouseEvent) => {
		let component;
		switch (chanceCard.type) {
			case ChanceCardType.ToMapItem:
				component = ToMapitem;
				break;
			case ChanceCardType.ToOtherPlayer:
				component = ToOtherPlayer;
				break;
			case ChanceCardType.ToPlayer:
				component = ToPlayer;
				break;
			case ChanceCardType.ToProperty:
				component = ToProperty;
				break;
			default:
				component = ToSelf;
				break;
		}

		const fragment = document.createDocumentFragment();
		const targetSelectorApp = createApp(component, {
			chanceCard,
			onUseCard: (targetId: string) => {
				useMonopolyClient().useChanceCard(chanceCard.id, targetId);
				unmount();
			},
			onCancel: unmount,
		}) as App<any>;
		const vm = targetSelectorApp.mount(fragment);
		document.body.appendChild(fragment);

		function unmount() {
			targetSelectorApp.unmount();
			useEventBus().remove(GameEventType.TimeOut, unmount);
		}

		eventEmitter.once(GameEventType.TimeOut, unmount);
	});
}
