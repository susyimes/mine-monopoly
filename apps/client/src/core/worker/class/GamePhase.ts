import {
    EventTiggerTime,
    GameContext,
    GameEvent,
    GamePhaseInfo,
    GamePhaseMark,
    IGamePhase,
} from "@fatpaper-monopoly/types";
import {compileTsToJs} from "@src/utils";
import {createAsyncFunction} from "@src/utils/function";

export class GamePhase implements IGamePhase<GameContext> {
    public id: string;
    public name: string;
    public description: string;
    public mark?: GamePhaseMark | undefined;
    public from: string;
    public initEventCode: string;
    public eventKey: string | undefined;

    public eventQueue: GameEvent<GameContext>[] = [];

    constructor(gamePhaseInfo: GamePhaseInfo, eventKey?: string) {
        this.id = gamePhaseInfo.id;
        this.name = gamePhaseInfo.name;
        this.description = gamePhaseInfo.description;
        this.mark = gamePhaseInfo.mark;
        this.from = gamePhaseInfo.from;
        this.initEventCode = gamePhaseInfo.initEventCode;
        this.eventKey = eventKey;
        const codeCompiled = compileTsToJs(this.initEventCode, "");
        const gameEventGenerator = new Function(codeCompiled);
        const gameEvent: GameEvent<GameContext> = {
            fn: gameEventGenerator(),
            key: eventKey,
        };
        this.eventQueue.push(gameEvent);
    }

    use(tiggerTime: EventTiggerTime, fnCode: string): void {
        const codeCompiled = compileTsToJs(fnCode, "");
        const gameEventGenerator = new Function(codeCompiled);
        const gameEvent = gameEventGenerator() as GameEvent<GameContext>;
        if (tiggerTime === EventTiggerTime.After) {
            this.eventQueue.push(gameEvent);
        } else {
            this.eventQueue.unshift(gameEvent);
        }
    }

    getEventQueue(): GameEvent<GameContext>[] {
        return this.eventQueue.concat().map((gameEvent) => {
            gameEvent.key = this.eventKey
            return gameEvent;
        });
    }
}
