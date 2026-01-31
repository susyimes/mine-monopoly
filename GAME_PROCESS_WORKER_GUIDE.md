# MineMonopoly GameProcess Worker 完整指南

## 目录
1. [架构概述](#架构概述)
2. [核心接口与类型](#核心接口与类型)
3. [游戏进程流程](#游戏进程流程)
4. [命令系统（Command System）](#命令系统command-system)
5. [修饰器系统（Modifier System）](#修饰器系统modifier-system)
6. [阶段系统（Phase System）](#阶段系统phase-system)
7. [通信协议](#通信协议)
8. [扩展点](#扩展点)
9. [代码示例](#代码示例)

---

## 架构概述

### 整体架构

MineMonopoly 采用混合 P2P 架构，游戏核心逻辑运行在 Web Worker 中的 `GameProcessWorker` 内：

```
┌─────────────────────────────────────────────────────────────┐
│                     GameProcessWorker                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              GameProcess (核心游戏逻辑)               │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │         GameRuntimeStack (事件栈)              │  │   │
│  │  │  ┌─────────────┐  ┌─────────────────────────┐ │  │   │
│  │  │  │ GamePhase 1 │  │ GamePhase 2             │ │  │   │
│  │  │  │ (DiceRoll) │  │ (PlayerMove)            │ │  │   │
│  │  │  └─────────────┘  └─────────────────────────┘ │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │              实体管理                          │  │   │
│  │  │  • Map<string, Player>    (玩家)              │  │   │
│  │  │  • Map<string, Property>  (地产)              │  │   │
│  │  │  • Map<string, MapEvent>  (地图事件)          │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │           事件总线 (mitt)                       │  │   │
│  │  │  • game.round.start/end                       │  │   │
│  │  │  • player.round.start/end                     │  │   │
│  │  │  • player.arrived/passed                      │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Worker 通信流程

```typescript
// 主线程与 Worker 的通信类型
enum WorkerCommType {
    WorkerReady,          // Worker 初始化完成
    LoadGameInfo,         // 加载游戏信息
    EmitOperation,        // 发送玩家操作
    UserOffLine,          // 玩家离线
    UserReconnect,        // 玩家重连
    SendToUsers,          // 发送消息给玩家
    GameOver,             // 游戏结束
}

// 主线程 -> Worker
postMessage({
    type: WorkerCommType.LoadGameInfo,
    data: { mapInfo, setting, userList, roomOwnerId }
})

// Worker -> 主线程
postMessage({
    type: WorkerCommType.SendToUsers,
    data: { userIdList, data: ServerSocketMessage }
})
```

---

## 核心接口与类型

### 1. IGameProcess

游戏进程的核心接口，位于 `packages/types/interfaces/game/game-process/core.ts`:

```typescript
interface IGameProcess {
    // 核心属性
    eventBus: Emitter<GameRuntimeEvent>;        // 事件总线
    exportData: IGameProcessExportData;         // 自定义导出数据
    mapData: GameMap;                           // 地图数据
    gameSetting: GameSetting;                   // 游戏设置
    players: Map<string, IPlayer>;              // 玩家集合
    properties: Map<string, IProperty>;         // 地产集合
    chanceCardInfos: Map<string, ChanceCardInfo>; // 机会卡信息
    currentRoundPlayer: IPlayer | null;         // 当前回合玩家
    currentRound: number;                       // 当前回合数
    gameRuntimeStack: IGameRuntimeStack<GameContext>; // 运行时栈
    roundTimeTimer: IRoundTimeTimer;            // 倒计时器

    // 核心方法
    handlePlayerBuyProperty(player, property): Promise<void>;
    handlePlayerBuildUp(player, property): Promise<void>;
    handleArriveEvent(arrivedPlayer): Promise<void>;
    handleUseChanceCard(sourcePlayer, chanceCardId, targetIdList): Promise<boolean>;

    // 玩家操作监听
    emitPlayerOperation<T>(playerId, operationType, data): void;
    oncePlayerOperationAsync<T>(playerId, operationType): Promise<T>;

    // 事件栈操作
    pushEventToStack(gameEvent): void;

    // UI 对话框
    showConfirmDialog<I>(playerId, option): Promise<ConfirmDialogResult<I>>;
    showTargetSelectDialog<I>(playerId, option): Promise<TargetSelectDialogResult<I>>;
    showItemSelectDialog(playerId, option): Promise<ItemSelectDialogResult>;
    showMessageCard(playerIds, option): Promise<void>;

    // 消息广播
    sendToPlayer(id, msg): void;
    gameDataBroadcast(): void;
    gameMsgNotifyBroadcast(type, msg): void;
    gameLogBroadcast(log): void;
    gameBroadcast(msg): void;
}
```

### 2. IPlayer

玩家实体接口，位于 `packages/types/interfaces/game/game-process/entities.ts`:

```typescript
interface IPlayer {
    // 基础属性
    id: string;
    name: string;
    roleId: string;
    money: number;
    properties: IProperty[];
    chanceCards: IChanceCard[];
    positionIndex: number;
    isStop: number;
    isBankrupted: boolean;
    isOffline: boolean;
    stop: number;
    roundPhases: IGamePhase<GameContext>[];
    dices: IDice[];
    infoDisplay: UISchema;
    exportData: IPlayerExportData;

    // 命令总线和修饰器管理器
    commandBus: ICommandBus<PlayerCommandMap>;
    modifierManager: IModifierManager<PlayerCommandMap>;

    // 地产操作
    gainProperty(property): Promise<void>;
    loseProperty(property): Promise<void>;

    // 机会卡操作
    gainCard(card): Promise<void>;
    loseCard(cardId): Promise<void>;

    // 金钱操作
    setMoney(money): void;
    cost(money, target?): Promise<void>;
    gain(money, source?): Promise<void>;

    // 游戏操作
    setStop(stop): void;
    setPositionIndex(newIndex): void;
    setBankrupted(isBankrupted): void;
    walk(step): Promise<void>;
    tp(positionIndex): Promise<void>;
    rollDices(): Promise<DiceResult[]>;
    addDice(diceValue?): Promise<IDice>;
    removeDice(id): Promise<IDice | undefined>;
}
```

### 3. IProperty

地产实体接口:

```typescript
interface IProperty {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    sellCost: number;
    buildCost: number;
    costList: number[];
    buildingModelIdList: string[] | undefined;
    custom: PropertyCustom | undefined;
    owner: IPlayer | undefined;
    exportData: IPropertyExportData;

    commandBus: ICommandBus<PropertyCommandMap>;

    levelUp(): Promise<void>;
    levelDown(): Promise<void>;
    setOwner(player): Promise<void>;
    setLevel(level): Promise<void>;
    arrived(player): Promise<void>;
    registerModifier(modifier): void;
}
```

### 4. IChanceCard

机会卡接口:

```typescript
interface IChanceCard {
    getId(): string;
    getSourceId(): string;
    getName(): string;
    getDescribe(): string;
    getIcon(): string;
    getType(): TargetSelectType;
    getColor(): string;
    getEffectCode(): string;

    use(sourcePlayer, target, gameProcess): Promise<void>;
    getChanceCardInfo(): ChanceCardClientInfo;
}
```

---

## 游戏进程流程

### 游戏循环结构

游戏循环在 `gameLoop()` 方法中实现:

```typescript
private async gameLoop() {
    this.gameDataBroadcast();
    this.roundTimeTimer.setIntervalFunction(this.roundRemainingTimeBroadcast);

    while (!this.isGameOver) {
        // ========== 回合开始阶段 ==========
        this.eventBus.emit("game.round.start");
        const roundStartPhases = this.gameRoundPhase.roundStartPhase;
        for (const phase of roundStartPhases) {
            await this.runGamePhase(phase);
        }

        // ========== 玩家回合阶段 ==========
        for (const player of Array.from(this.players.values())) {
            this.eventBus.emit("player.round.start", { player });
            const context: PlayerRoundContext = {
                currentRoundPlayer: player,
            };
            const playerRoundPhases = player.getRoundPhases();
            for (const phase of playerRoundPhases) {
                await this.runGamePhase(phase, context);
            }
            this.eventBus.emit("player.round.end", { player });
        }

        // ========== 回合结束阶段 ==========
        const roundEndPhases = this.gameRoundPhase.roundEndPhase;
        for (const phase of roundEndPhases) {
            await this.runGamePhase(phase);
        }
        this.eventBus.emit("game.round.end");
    }
}
```

### 预设游戏阶段

游戏地图可以定义以下阶段：

| 阶段分类 | 阶段名称 | 说明 |
|---------|---------|------|
| `gameInited` | 游戏初始化 | 游戏开始前执行一次 |
| `gameRoundStart` | 回合开始 | 每回合开始时执行 |
| `gameRoundEnd` | 回合结束 | 每回合结束时执行 |
| `gameOverRule` | 游戏结束规则 | 每次检查游戏是否结束 |
| `playerRound` | 玩家回合 | 每个玩家的回合阶段 |

### 玩家回合阶段标记 (GamePhaseMark)

```typescript
enum GamePhaseMark {
    GameRoundStart,      // 游戏回合开始
    PlayerRoundStart,    // 玩家回合开始
    RollDice,            // 掷骰子
    PlayerMove,          // 玩家移动
    ArrivedEvent,        // 到达事件
    PlayerRoundEnd,      // 玩家回合结束
    GameRoundEnd,        // 游戏回合结束
}
```

### 游戏事件总线 (GameRuntimeEvent)

```typescript
type GameRuntimeEvent = {
    "game.round.start": void;
    "game.round.end": void;
    "player.round.start": { player: IPlayer };
    "player.round.end": { player: IPlayer };
    "player.arrived": { positionIndex: number; player: IPlayer };
    "player.passed": { passedMapItemsId: string[]; player: IPlayer };
} & Record<string, any>;
```

使用示例：
```typescript
gameProcess.eventBus.on("player.arrived", ({ positionIndex, player }) => {
    console.log(`${player.name} 到达了位置 ${positionIndex}`);
});
```

---

## 命令系统（Command System）

### 命令模式架构

命令系统采用 CQRS 风格，所有实体操作通过 CommandBus 执行：

```typescript
interface ICommand<C extends ICommandMap, K extends keyof C> {
    type: K;
    payload: C[K]["payload"];
}

interface ICommandBus<C extends ICommandMap> {
    execute<K extends keyof C>(command: ICommand<C, K>): Promise<C[K]["result"]>;
    setHandler<K extends keyof C>(type, handler): void;
}
```

### 命令执行流程

```
命令执行 → Before 修饰器 → Handler → After 修饰器 → 返回结果
           (可取消)        (核心逻辑)  (可修改结果)
```

### PlayerCommandMap

定义所有玩家命令：

```typescript
interface PlayerCommandMap {
    // 地产
    "player.property.gain": {
        payload: { property: IProperty };
        result: { property: IProperty };
    };
    "player.property.lose": { /* ... */ };

    // 机会卡
    "player.card.gain": { /* ... */ };
    "player.card.lose": { /* ... */ };

    // 金钱
    "player.money.gain": {
        payload: { money: number; source?: IPlayer };
        result: { money: number; source?: IPlayer };
    };
    "player.money.lose": { /* ... */ };

    // 移动
    "player.walk": { /* ... */ };
    "player.tp": { /* ... */ };

    // 骰子
    "player.dice.roll": { /* ... */ };
    "player.dice.add": { /* ... */ };
    "player.dice.remove": { /* ... */ };
}
```

### PropertyCommandMap

定义所有地产命令：

```typescript
interface PropertyCommandMap {
    "property.owner.change": {
        payload: { oldOwner: IPlayer | undefined; newOwner: IPlayer | undefined };
        result: { /* ... */ };
    };
    "property.level.up": { /* ... */ };
    "property.level.down": { /* ... */ };
    "property.level.set": { /* ... */ };
    "property.arrived": { /* ... */ };
}
```

### 命令使用示例

```typescript
// 玩家操作
await player.gain(1000);                     // 通过 commandBus 执行 "player.money.gain"
await player.cost(500, otherPlayer);          // 执行 "player.money.lose"
await player.walk(3);                         // 执行 "player.walk"

// 地产操作
await property.setOwner(player);              // 执行 "property.owner.change"
await property.levelUp();                     // 执行 "property.level.up"
await property.arrived(player);               // 执行 "property.arrived"
```

---

## 修饰器系统（Modifier System）

### 修饰器架构

修饰器系统允许在命令执行前后插入自定义逻辑，实现 Buff/Debuff 效果：

```typescript
interface IModifier<C extends ICommandMap, K extends keyof C> {
    descriptor: ModifierDescriptor<C, K>;
    fn(command: ICommand<C, K>, context: ICommandContext<C, K>): Promise<void> | void;
}

interface ModifierDescriptor<C, K> {
    id: string;
    timing: ModifierTiming;              // "before" | "after"
    commandType: K;
    remainingTriggers: number;           // -1 表示无限次
    priority?: number;                   // 执行优先级
    meta?: ModifierMeta;                 // UI 显示信息
}

interface ModifierMeta {
    name: string;
    timingName: string;
    description: string;
    source: string;
    tags?: string[];
}
```

### 修饰器执行时机

```typescript
enum ModifierTiming {
    Before = "before",  // 命令执行前
    After  = "after",   // 命令执行后
}
```

### 修饰器执行顺序

1. **Before 修饰器**: 按 `priority` 降序执行
2. **命令 Handler**: 执行核心逻辑
3. **After 修饰器**: 按 `priority` 降序执行
4. **衰减**: 执行完成后，`remainingTriggers` 减 1，归零时移除

### 修饰器使用示例

```typescript
// 给玩家添加一个 "护盾" Buff
player.modifierManager.add({
    descriptor: {
        id: "shield-buff-1",
        timing: "before",
        commandType: "player.money.lose",
        remainingTriggers: 1,  // 抵挡一次伤害
        priority: 100,
        meta: {
            name: "护盾",
            timingName: "受到伤害时",
            description: "抵挡一次伤害",
            source: "魔法药水",
            tags: ["shield", "buff"],
        },
    },
    fn: async (cmd, ctx) => {
        console.log("护盾抵挡了伤害！");
        ctx.cancel();  // 取消原命令
        ctx.setResult({ money: 0, target: cmd.payload.target });
    },
});

// 检查玩家是否有护盾
const hasShield = player.modifierManager.hasBuffWithTag("shield");

// 移除所有标签为 "poison" 的修饰器
player.modifierManager.removeByTag("poison");
```

### Buff 数据结构

用于客户端展示：

```typescript
interface Buff {
    id: string;
    name: string;
    description: string;
    source: string;
    triggerTiming: string;
    triggerTimes: number;  // -1 表示无限
    tags?: string[];
}
```

---

## 阶段系统（Phase System）

### GamePhase 接口

```typescript
interface IGamePhase<Context extends GameContext> {
    id: string;
    name: string;
    description: string;
    mark?: GamePhaseMark;
    from: string;
    initEventCode: string;              // TypeScript 代码字符串

    eventQueue: GameEvent<Context>[];

    use(tiggerTime: ModifierTiming, fn: GameEventFunction<Context>, key?): void;
    getEventQueue(): GameEvent<Context>[];
}
```

### GameEvent 类型

```typescript
type GameEvent<Context extends GameContext> = {
    fn: GameEventFunction<Context>;
    key?: string;
};

type GameEventFunction<Context> = (
    ctx: Context,
    gameProcess: IGameProcess
) => Promise<void> | void;
```

### 阶段执行流程

```typescript
public async runGamePhase(phase: IGamePhase<GameContext>, context?: GameContext) {
    this.currentGamePhase = phase;

    // 将游戏结束检查事件压入栈
    const checkGameOverEvent = {
        fn: this.checkGameOver.bind(this),
        key: "GameOverCheck",
    };

    // 将阶段的事件队列反向压入栈（栈是 LIFO）
    this.gameRuntimeStack.push(...[checkGameOverEvent, ...phase.getEventQueue().reverse()]);

    // 运行事件栈
    await this.gameRuntimeStack.run(context, this);
}
```

### GameRuntimeStack

事件栈负责管理事件执行顺序：

```typescript
interface IGameRuntimeStack<Context extends GameContext> {
    stack: GameEvent<Context>[];
    run(context: Context, gameProcess: IGameProcess): Promise<void>;
    isEmpty(): boolean;
    push(...gameEvents: GameEvent<Context>[]): void;
    pop(): GameEvent<Context> | undefined;
}
```

### 阶段代码示例

```typescript
// 在地图编辑器中定义一个掷骰子阶段
const rollDicePhase: GamePhaseInfo = {
    id: "roll-dice-phase",
    name: "掷骰子阶段",
    description: "玩家掷骰子决定移动步数",
    mark: GamePhaseMark.RollDice,
    from: "MapEditor",
    initEventCode: `
        return async (ctx: RollDiceContext, gameProcess: IGameProcess) => {
            const player = ctx.currentRoundPlayer;

            // 通知玩家掷骰子
            gameProcess.roundTurnNotify(player.id);

            // 等待玩家操作
            await gameProcess.oncePlayerOperationAsync(player.id, OperateType.RollDice);

            // 执行掷骰子命令
            const diceResult = await player.rollDices();

            // 更新上下文，传递给下一个阶段
            ctx.diceResult = diceResult;
        };
    `,
};
```

---

## 通信协议

### Socket 消息类型

所有 P2P 消息使用 `SocketMessage<T, S>` 类型：

```typescript
interface SocketMessage<T extends SocketMsgType, S extends SocketMsgSource> {
    type: T;
    source: S;                    // "client" | "server"
    data: SocketMessageDataType[T][S];
    msg?: {
        type: "info" | "success" | "warning" | "error";
        content: string;
    };
    extra?: any;
    roomId?: string;
}
```

### 主要消息类型

| 消息类型 | 方向 | 说明 |
|---------|------|------|
| `GameInit` | Server→Client | 游戏初始化数据 |
| `GameData` | Server→Client | 游戏状态广播 |
| `GameLog` | Server→Client | 游戏日志 |
| `MsgNotify` | Server→Client | 消息通知 |
| `RoundTurn` | Server→Client | 回合通知 |
| `RollDiceResult` | Server→Client | 骰子结果 |
| `PlayerWalk` | Server→Client | 玩家移动动画 |
| `PlayerTp` | Server→Client | 玩家传送 |
| `ConfirmDialog` | Server→Client | 显示确认对话框 |
| `TargetSelectDialog` | Server→Client | 显示目标选择对话框 |
| `ItemSelectDialog` | Server→Client | 显示自定义选择对话框 |
| `MessageCard` | Server→Client | 显示消息卡片 |
| `Operation` | Client→Server | 玩家操作 |

### 玩家操作类型 (OperateType)

```typescript
enum OperateType {
    GameInitFinished = "GameInitFinished",          // 前端加载完毕
    RollDice = "RollDice",                          // 前端掷骰子
    UseChanceCard = "UseChanceCard",                // 使用机会卡
    Animation = "AnimationComplete",                // 前端动画完成
    MapResourceLoaded = "MapResourceLoaded",        // 地图资源加载完毕
    PauseGame = "PauseGame",                        // 房主暂停游戏
    ResumeGame = "ResumeGame",                      // 房主恢复游戏
    ConfirmDialogResult = "ConfirmDialogResult",    // 对话框结果
    TargetSelectDialogResult = "TargetSelectDialogResult",
    ItemSelectDialogResult = "ItemSelectDialogResult",
}
```

### 操作监听

```typescript
// 监听一次性操作
await gameProcess.oncePlayerOperationAsync(playerId, OperateType.RollDice);

// 监听持久操作
gameProcess.onPlayerOperation(playerId, OperateType.PauseGame, () => {
    gameProcess.roundTimeTimer.pause();
});

// 发送操作给 Worker
gameProcess.emitPlayerOperation(playerId, OperateType.RollDice, undefined);
```

---

## 扩展点

### 1. 自定义玩家数据

使用 `declare module` 扩展玩家字段：

```typescript
// types/extensions.ts
declare module "@mine-monopoly/types" {
    interface IPlayerCustomFields {
        customSkill?: string;
        exp?: number;
    }

    interface IPlayerExportData {
        achievements: string[];
    }
}
```

### 2. 自定义游戏进程数据

```typescript
declare module "@mine-monopoly/types" {
    interface IGameProcessCustomFields {
        customGameMode?: string;
        tournamentId?: string;
    }

    interface IGameProcessExportData {
        statistics: Record<string, any>;
    }
}
```

### 3. 自定义地产数据

```typescript
declare module "@mine-monopoly/types" {
    interface IPropertyCustomFields {
        specialEffect?: string;
        resourceType?: string;
    }

    interface IPropertyExportData {
        customData?: any;
    }
}
```

### 4. 自定义游戏事件

```typescript
// 扩展 GameRuntimeEvent
declare module "@mine-monopoly/types" {
    interface GameRuntimeEvent {
        "custom.event.name": { customData: any };
    }
}

// 使用
gameProcess.eventBus.emit("custom.event.name", { customData: "test" });
```

### 5. 自定义 UI 模板

在地图编辑器中创建 UI 模板，然后在代码中引用：

```typescript
// 1. 在地图编辑器创建模板
const uiTemplate: UITemplate = {
    id: "player-info-card",
    slug: "player-info",
    name: "玩家信息卡片",
    template: {
        id: "info-card",
        type: "div",
        style: { /* ... */ },
        children: [
            { type: "text", textBinding: "player.name" },
            { type: "text", textBinding: "player.money" },
        ],
    },
};

// 2. 在效果代码中使用 $ui__slug 引用
const effectCode = `
    return async (ctx, gameProcess) => {
        const player = ctx.currentRoundPlayer;

        await gameProcess.showConfirmDialog(player.id, {
            title: "玩家信息",
            content: $ui__player-info,  // 会被替换为实际的 JSON
            confirmText: "确定",
            cancelText: "取消",
        });
    };
`;
```

---

## 代码示例

### 示例 1: 创建自定义机会卡

```typescript
// 在地图编辑器中定义机会卡
const chanceCard: ChanceCardInfo = {
    id: "steal-money-card",
    name: "抢夺卡",
    description: "抢夺目标玩家 500 元",
    type: TargetSelectType.ToOtherPlayer,
    color: "#ff0000",
    iconId: "icon-steal",
    effectCode: `
        return async (sourcePlayer: IPlayer, target: IPlayer, gameProcess: IGameProcess) => {
            // 扣除目标玩家金钱
            await target.cost(500, sourcePlayer);

            // 自己获得金钱
            await sourcePlayer.gain(500, target);

            // 发送日志
            gameProcess.gameLogBroadcast(
                `\${sourcePlayer.name} 使用抢夺卡抢夺了 \${target.name} 500 元！`
            );
        };
    `,
};
```

### 示例 2: 创建自定义地图事件

```typescript
// 到达事件
const arrivedEvent: MapEvent = {
    id: "lucky-event",
    name: "幸运事件",
    type: MapEventType.ArrivedEvent,
    effectCode: `
        return async (player: IPlayer, gameProcess: IGameProcess) => {
            // 随机获得金钱
            const bonus = Math.floor(Math.random() * 1000) + 100;
            await player.gain(bonus);

            gameProcess.gameMsgNotifyBroadcast(
                "success",
                `\${player.name} 触发了幸运事件，获得了 \${bonus} 元！`
            );
        };
    `,
};

// 经过事件
const passedEvent: MapEvent = {
    id: "toll-event",
    name: "过路费",
    type: MapEventType.PassedEvent,
    effectCode: `
        return async (player: IPlayer, gameProcess: IGameProcess) => {
            const toll = 100;
            await player.cost(toll);

            gameProcess.gameMsgNotifyBroadcast(
                "warning",
                `\${player.name} 经过收费点，支付了 \${toll} 元`
            );
        };
    `,
};
```

### 示例 3: 创建自定义游戏阶段

```typescript
// 游戏回合开始阶段
const gameRoundStartPhase: GamePhaseInfo = {
    id: "interest-phase",
    name: "利息阶段",
    description: "每个回合开始时，玩家获得利息",
    mark: GamePhaseMark.GameRoundStart,
    from: "MapEditor",
    initEventCode: `
        return async (ctx: GameContext, gameProcess: IGameProcess) => {
            for (const player of gameProcess.players.values()) {
                if (!player.isBankrupted && player.money > 0) {
                    const interest = Math.floor(player.money * 0.05);
                    await player.gain(interest);
                }
            }
        };
    `,
};

// 玩家回合阶段
const playerRollDicePhase: GamePhaseInfo = {
    id: "roll-dice",
    name: "掷骰子",
    description: "玩家掷骰子决定移动步数",
    mark: GamePhaseMark.RollDice,
    from: "MapEditor",
    initEventCode: `
        return async (ctx: PlayerRoundStartContext, gameProcess: IGameProcess) => {
            const player = ctx.currentRoundPlayer;

            // 通知玩家
            gameProcess.roundTurnNotify(player.id);

            // 等待玩家掷骰子
            await gameProcess.oncePlayerOperationAsync(player.id, OperateType.RollDice);

            // 执行掷骰子
            const diceResult = await player.rollDices();
            const totalSteps = diceResult.reduce((sum, d) => sum + d.result, 0);

            // 传递给下一阶段
            ctx.diceResult = diceResult;
        };
    `,
};
```

### 示例 4: 使用修饰器系统

```typescript
// 在角色初始化代码中添加修饰器
const role: Role = {
    id: "rich-role",
    name: "富人角色",
    description: "初始金钱翻倍，收入增加 20%",
    avatarUrl: "",
    initCode: `
        return (player: IPlayer, gameProcess: IGameProcess) => {
            // 初始金钱翻倍
            player.setMoney(player.money * 2);

            // 添加收入增加修饰器
            player.modifierManager.add({
                descriptor: {
                    id: "rich-buff",
                    timing: "before",
                    commandType: "player.money.gain",
                    remainingTriggers: -1,  // 无限次
                    priority: 10,
                    meta: {
                        name: "富人天赋",
                        timingName: "获得金钱时",
                        description: "收入增加 20%",
                        source: "富人角色",
                        tags: ["passive", "buff"],
                    },
                },
                fn: async (cmd, ctx) => {
                    const bonus = Math.floor(cmd.payload.money * 0.2);
                    if (bonus > 0) {
                        await player.commandBus.execute({
                            type: "player.money.gain",
                            payload: { money: bonus, source: cmd.payload.source },
                        });
                    }
                },
            });
        };
    `,
};
```

### 示例 5: 自定义地产

```typescript
const customProperty: PropertyInfo = {
    id: "bank-property",
    name: "银行",
    level: 0,
    maxLevel: 5,
    sellCost: 2000,
    buildCost: 1000,
    costList: [100, 200, 400, 800, 1600],
    buildingModelIdList: ["bank-level-1", "bank-level-2"],
    custom: {
        effectCode: `
            return async (property: IProperty, gameProcess: IGameProcess) => {
                // 自定义初始化逻辑
                property.exportData.interestRate = 0.1;

                // 注册修饰器：玩家到达时获得利息
                property.commandBus.setHandler("property.arrived", async (payload) => {
                    const { arrivedPlayer, owner } = payload;

                    if (owner && owner.id === arrivedPlayer.id) {
                        // 主人到达时，获得利息
                        const interest = Math.floor(owner.money * property.exportData.interestRate);
                        await owner.gain(interest);

                        gameProcess.messageNotify([owner.id], {
                            type: "success",
                            content: `你的银行产生了 \${interest} 元利息！`,
                        });
                    }

                    return payload;
                });
            };
        `,
        description: "主人到达时获得 10% 利息",
    },
};
```

---

## 重要文件路径索引

| 类型 | 文件路径 |
|-----|---------|
| 核心类型 | `packages/types/interfaces/game/game-process/` |
| Socket 类型 | `packages/types/interfaces/game/socket.ts` |
| 枚举 | `packages/types/enums/game/` |
| Worker 主文件 | `apps/client/src/core/worker/GameProcessWorker.ts` |
| Player 类 | `apps/client/src/core/worker/class/Player.ts` |
| Property 类 | `apps/client/src/core/worker/class/Property.ts` |
| ChanceCard 类 | `apps/client/src/core/worker/class/ChanceCard.ts` |
| GamePhase 类 | `apps/client/src/core/worker/class/GamePhase.ts` |
| GameRuntimeStack 类 | `apps/client/src/core/worker/class/GameRuntimeStack.ts` |
| CommandBus 类 | `apps/client/src/core/worker/class/action-system/CommandBus.ts` |
| ModifierManager 类 | `apps/client/src/core/worker/class/action-system/ModifiersManager.ts` |
| OperateListener 类 | `apps/client/src/core/worker/class/OperateListener.ts` |
| 代码编辑器组件 | `apps/map-editor/src/components/code-editor/index.vue` |
| 客户端脚本执行工具 | `apps/client/src/utils/index.ts` |
| Monaco 类型生成插件 (client) | `apps/client/plugins/vite-plugin-generate-monaco-dts.ts` |
| Monaco 类型生成插件 (editor) | `apps/map-editor/plugins/vite-plugin-generate-monaco-dts.ts` |

---

## 技术实现细节

### 1. 代码编辑器类型系统

地图编辑器中的代码编辑器支持完整的 TypeScript 类型提示和自动补全：

**实现流程：**

```
uiTemplate (当前地图的 UI 模板)
    ↓
Vite 插件生成 .d.ts 类型文件
    ↓
Monaco Editor 通过 extraLibs 注入类型
    ↓
用户获得自动补全和类型提示
```

**核心文件：** `apps/map-editor/src/components/code-editor/index.vue`

- 自动读取当前地图编辑器的 `uiTemplate`
- 将 `uiTemplate` 转换为 TypeScript `.d.ts` 类型定义
- 通过 Monaco Editor 的 `extraLibs` 属性注入类型提示
- 提供完整的自动补全和智能提示功能

### 2. 动态代码执行与安全隔离

地图编辑器中编写的 TypeScript 代码通过 `new Function()` 在 Worker 中执行：

**安全隔离机制：**

```
地图编辑器代码
    ↓
编译为 JavaScript
    ↓
在 GameProcessWorker 中通过 new Function() 执行
    ↓
Worker 沙箱隔离
    ↓
无法访问外部全局变量（Worker 特性）
    ↓
不会侵入 Worker 外部的代码
```

**核心特性：**

- Worker 充当沙箱角色，隔离执行环境
- 无法访问主线程的全局变量和 DOM
- 无法访问 Worker 外部的代码和状态
- 提供了基础的代码执行安全性

**客户端脚本执行：** `apps/client/src/utils/index.ts`

- 直接使用 Vite 插件编译后的文件
- 支持完整的 TypeScript 语法
- 运行时类型检查和错误处理

> **注意：** 虽然 Worker 提供了基础隔离，但仍需注意代码注入、XSS 等安全问题。后续可以进一步讨论安全加固方案。

### 3. OperateListener 实现原理

`OperateListener` 是一个为 `playerId` 和 `playerEvent` 封装的 EventEmitter：

**实现位置：** `apps/client/src/core/worker/class/OperateListener.ts`

**核心功能：**

```typescript
class OperateListener {
    // 监听特定玩家的操作
    once(playerId: string, operateType: OperateType): Promise<any>

    // 持续监听操作
    on(playerId: string, operateType: OperateType, callback: Function): void

    // 触发操作
    emit(playerId: string, operateType: OperateType, data: any): void
}
```

**使用场景：**

- 等待玩家掷骰子：`gameProcess.oncePlayerOperationAsync(playerId, OperateType.RollDice)`
- 监听暂停/恢复操作：`gameProcess.onPlayerOperation(playerId, OperateType.PauseGame, callback)`
- 对话框结果处理：`gameProcess.oncePlayerOperationAsync(playerId, OperateType.ConfirmDialogResult)`

### 4. Monaco Editor 类型提示生成

Monaco Editor 的类型提示通过 Vite 插件自动生成：

**插件文件：**

- **Client**: `apps/client/plugins/vite-plugin-generate-monaco-dts.ts`
- **Map Editor**: `apps/map-editor/plugins/vite-plugin-generate-monaco-dts.ts`

**生成流程：**

```
editor-lib.ts (源类型文件)
    ↓
Vite 插件编译 (vite-plugin-generate-monaco-dts.ts)
    ↓
editor-lib.d.ts (生成的类型定义文件)
    ↓
Monaco extraLibs 注入
    ↓
完整的类型提示和自动补全
```

**文件位置：**

- 父组件通常会加载同级目录下的 `editor-lib.d.ts` 文件
- 该文件由 Vite 插件根据同级目录的 `editor-lib.ts` 自动生成
- 支持完整的 TypeScript 类型系统

### 5. 动画状态同步策略

当前实现采用简化的动画处理策略：

**设计原则：**

- **动画不参与核心游戏逻辑**：动画是纯视觉表现
- **超时机制**：服务端有最长动画时间限制
- **全量状态同步**：重连后直接同步最新游戏状态

**处理流程：**

```
服务端触发动画
    ↓
等待客户端完成信号 (OperateType.Animation)
    ↓
超时检查 (最长动画时间)
    ↓
超时 → 服务端代替客户端提交完成信号
    ↓
继续游戏逻辑
```

**断线重连处理：**

- 客户端断线时，服务端继续等待动画完成或超时
- 客户端重连后，接收游戏的完整最新状态
- 直接渲染最新状态，不恢复未完成的动画

**优势：**

- 避免复杂的动画状态同步逻辑
- 简化断线重连流程
- 动画异常不影响游戏核心逻辑

### 6. 自定义 UI 模板引用

在地图编辑器中创建 UI 模板后，可在代码中通过 `$ui__slug` 语法引用：

**示例：**

```typescript
// 1. 在地图编辑器创建模板
const uiTemplate: UITemplate = {
    id: "player-info-card",
    slug: "player-info",
    name: "玩家信息卡片",
    template: { /* ... */ },
};

// 2. 在效果代码中使用
const effectCode = `
    return async (ctx, gameProcess) => {
        await gameProcess.showConfirmDialog(player.id, {
            title: "玩家信息",
            content: $ui__player-info,  // 会被替换为实际的 JSON
        });
    };
`;
```

**转换机制：**

- `$ui__slug` 会在代码执行前被替换为实际的 UI Schema JSON
- 支持在对话框、消息卡片等场景中使用自定义 UI
- 与类型系统完全集成，提供类型提示

---

## 常见开发场景

### 场景 1: 添加新的玩家操作

1. 在 `packages/types/enums/game/game-process.ts` 添加 `OperateType`
2. 在 `packages/types/interfaces/game/socket.ts` 添加 `PlayerOperationResult` 类型
3. 在 Worker 中监听操作：`gameProcess.oncePlayerOperationAsync(playerId, OperateType.YourOp)`

### 场景 2: 添加新的游戏事件

1. 扩展 `GameRuntimeEvent` 类型
2. 在适当位置触发事件：`gameProcess.eventBus.emit("your.event", data)`
3. 监听事件：`gameProcess.eventBus.on("your.event", handler)`

### 场景 3: 修改游戏逻辑

1. 找到对应的 Handler 或阶段代码
2. 修改地图编辑器中的效果代码
3. 保存地图并重新测试

### 场景 4: 添加新的 Buff 效果

1. 创建修饰器并添加到玩家的 `modifierManager`
2. 设置合适的 `timing`、`commandType`、`remainingTriggers`
3. 在 `meta` 中定义 UI 显示信息

### 场景 5: 在代码编辑器中使用 UI 模板

1. 在地图编辑器的 UI 模板编辑器中创建自定义模板
2. 设置模板的 `slug`（如 `player-info`）
3. 在效果代码中使用 `$ui__slug` 引用模板
4. Vite 插件会自动生成类型提示

```typescript
const effectCode = `
    return async (ctx, gameProcess) => {
        await gameProcess.showConfirmDialog(player.id, {
            title: "玩家状态",
            content: $ui__player-info,  // 自动类型提示
        });
    };
`;
```

### 场景 6: 添加自定义 Monaco 类型提示

1. 在 `editor-lib.ts` 中定义类型和函数
2. Vite 插件 `vite-plugin-generate-monaco-dts.ts` 自动生成 `.d.ts` 文件
3. 父组件通过 `extraLibs` 注入类型定义
4. 用户获得完整的类型提示和自动补全

### 场景 7: 处理动画超时

```typescript
// 服务端触发动画后，等待客户端完成
gameProcess.sendToPlayer(playerId, {
    type: SocketMsgType.PlayerWalk,
    data: { /* ... */ },
});

// 等待动画完成，带超时机制
const result = await Promise.race([
    gameProcess.oncePlayerOperationAsync(playerId, OperateType.Animation),
    new Promise((resolve) => setTimeout(resolve, 5000)),  // 5秒超时
]);

// 继续游戏逻辑
```

### 场景 8: 监听玩家操作事件

```typescript
// 一次性监听
await gameProcess.oncePlayerOperationAsync(playerId, OperateType.RollDice);

// 持续监听
gameProcess.onPlayerOperation(playerId, OperateType.PauseGame, () => {
    gameProcess.roundTimeTimer.pause();
});

// 手动触发操作
gameProcess.emitPlayerOperation(playerId, OperateType.RollDice, diceData);
```

---

## 总结

MineMonopoly 的 GameProcess Worker 是一个功能强大的游戏逻辑引擎，主要特点：

1. **命令模式**: 所有操作通过 CommandBus 执行，便于扩展和修改
2. **修饰器系统**: 灵活的 Buff/Debuff 机制
3. **阶段系统**: 模块化的游戏流程控制
4. **事件驱动**: 使用 mitt 事件总线进行解耦
5. **动态代码**: 地图编辑器中的 TypeScript 代码动态编译执行
6. **可扩展**: 通过 `declare module` 轻松扩展自定义字段
7. **类型安全**: Monaco Editor 完整的 TypeScript 类型提示和自动补全
8. **安全隔离**: Worker 沙箱环境执行动态代码，避免主线程污染
9. **动画解耦**: 动画与游戏逻辑分离，简化状态同步

掌握这个系统后，你可以通过地图编辑器创建完全自定义的大富翁游戏玩法！

---

## 安全性考虑

### 当前安全机制

1. **Worker 沙箱隔离**
   - 动态代码在独立的 Worker 线程中执行
   - 无法访问主线程的全局变量和 DOM
   - 无法访问 Worker 外部的代码和状态

2. **P2P 架构隔离**
   - 游戏逻辑在客户端 Host 运行
   - 中央 Server 仅负责认证和信令
   - 减少 Server 侧的代码执行风险

### 潜在安全风险

1. **代码注入**
   - 地图编辑器中的代码可能包含恶意逻辑
   - 需要验证代码来源和权限

2. **资源消耗**
   - 无限循环可能导致 Worker 卡死
   - 需要添加执行超时和资源限制

3. **数据泄露**
   - 动态代码可能访问游戏进程的敏感数据
   - 需要限制代码的可访问范围

### 建议的安全加固方案

1. **代码沙箱增强**
   ```typescript
   // 使用 Proxy 限制可访问对象
   const sandbox = new Proxy(gameProcess, {
       get(target, prop) {
           if (prop === 'dangerousAPI') {
               throw new Error('Access denied');
           }
           return target[prop];
       }
   });
   ```

2. **执行超时机制**
   ```typescript
   const result = await Promise.race([
       executeUserCode(code, sandbox),
       new Promise((_, reject) =>
           setTimeout(() => reject(new Error('Timeout')), 5000)
       )
   ]);
   ```

3. **代码审核系统**
   - 地图分享前进行代码审核
   - 实现地图签名和验证机制
   - 提供受信任的地图商店

4. **资源监控**
   - 监控 Worker 的内存和 CPU 使用
   - 设置资源使用上限
   - 异常时自动恢复

---

## 最佳实践

### 1. 地图开发

- ✅ 使用类型提示：充分利用 Monaco Editor 的自动补全
- ✅ 模块化代码：将复杂逻辑拆分为多个函数
- ✅ 错误处理：使用 try-catch 捕获异常
- ✅ 注释说明：为复杂逻辑添加注释
- ❌ 避免无限循环：确保所有循环都有退出条件
- ❌ 避免阻塞操作：长时间计算应使用异步

### 2. 性能优化

- ✅ 使用事件总线：解耦模块间通信
- ✅ 合理使用修饰器：避免创建过多短期修饰器
- ✅ 批量操作：合并多个小的状态更新
- ❌ 避免频繁的 DOM 操作：动画由前端统一管理

### 3. 调试技巧

```typescript
// 在 Worker 代码中添加日志
gameProcess.gameLogBroadcast(`调试信息: ${JSON.stringify(data)}`);

// 使用修饰器监听命令执行
player.modifierManager.add({
    descriptor: {
        id: "debug-modifier",
        timing: "before",
        commandType: "player.money.gain",
        remainingTriggers: -1,
    },
    fn: async (cmd, ctx) => {
        console.log("玩家获得金钱:", cmd.payload);
    },
});
```

---

## 扩展阅读

- [Monorepo 架构说明](./CLAUDE.md)
- [Protocol Buffers 地图格式](./packages/utils/protos/game-map.proto)
- [Socket 通信协议](./packages/types/interfaces/game/socket.ts)
- [类型定义扩展](./packages/types/index.ts)
