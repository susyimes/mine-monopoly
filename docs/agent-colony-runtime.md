# Agent 群落运行时

状态：M2.5 初版已落地
日期：2026-06-03

## 结论

`monopoly` 的 agent 机制已开始抽成可迁移的多人游戏运行时。当前不把群落机制直接塞进 memsuOS 本体，而是新增独立的 `AgentColonyRuntime`，让 memsuOS 以后承担模型配置、人格、记忆和长期状态，游戏协议仍由独立 adapter 负责。

## 分层

```text
memsuOS
  ├─ 模型 provider 配置
  ├─ agent 人格与长期记忆
  └─ 跨游戏身份与关系状态

AgentColonyRuntime
  ├─ 读取游戏事件
  ├─ 读取统一快照
  ├─ 枚举合法动作
  ├─ 调用策略决策
  ├─ 下发动作
  └─ 记录观察、决策和兜底

GameAdapter
  ├─ 解析具体游戏协议
  ├─ 映射合法动作
  ├─ 执行具体动作
  └─ 检测卡住和超时
```

## 已实现

新增通用层：

```text
tools/ai-live/src/colony/
  types.ts
  runtime.ts
  index.ts
```

核心接口：

- `AgentIdentity`：agent 身份、人设、memsuOS memory 引用预留。
- `GameSnapshot`：跨游戏状态快照。
- `GameEvent`：跨游戏事件。
- `GameAction`：跨游戏动作。
- `GameAdapter`：游戏适配器接口。
- `AgentColonyRuntime`：事件读取、动作决策、派发和回调调度。

新增第一个游戏 adapter：

```text
tools/ai-live/src/adapters/monopoly/automation-bridge-adapter.ts
```

该 adapter 把 `?automation=1` 客户端 bridge 映射为通用事件和动作：

| Monopoly 事件 | 通用事件 |
| --- | --- |
| `GameInit` | `monopoly.game-init` |
| `RoundTurn` | `monopoly.turn.prompt` |
| `BuyProperty` / `BuildHouse` | `monopoly.property.prompt` |
| `PlayerWalk` / `PlayerTp` | `monopoly.player-movement` |
| `Animation` out message | `monopoly.animation.completed` |
| stale walk id | `monopoly.animation.stale` |

| 通用动作 | Monopoly bridge |
| --- | --- |
| `monopoly.game-init-finished` | `gameInitFinished()` |
| `monopoly.roll-dice` | `rollDice()` |
| `monopoly.buy-property` | `buyProperty(accept)` |
| `monopoly.build-house` | `buildHouse(accept)` |
| `monopoly.animation-complete` | `animationComplete(walkId)` |

## memsuOS 适配边界

适合放进 memsuOS 的部分：

- agent 人格档案
- agent 长期记忆
- 模型 provider 配置
- 跨游戏关系、偏好和复盘摘要
- 群落级记忆，例如联盟、敌意、风格迁移

不建议放进 memsuOS 本体的部分：

- 某个游戏的协议解析
- 多浏览器或多客户端控制
- 回合/实时游戏 timing
- 合法动作枚举
- WebSocket、PeerJS、HTTP action executor
- 卡住检测和动画确认

因此后续应做一个 memsuOS adapter，而不是把 `GameAdapter` 写进 memsuOS 核心。

## 下一步

已完成：

- 增加 `MemsuMemoryPort`，可从 memsuOS 本地 profile 文件读取 agent 档案，并在显式打开 `AI_LIVE_MEMSU_MEMORY=1` 时写入候选复盘记忆。
- 增加 `buildHouse` 定向复核测试，确认 `monopoly.build-house` 可以通过 adapter 调用 `buildHouse(accept)`。

下一步：

1. 把 `BotPersonality` 逐步迁移为可由 memsuOS 注入的 profile。
2. 为第二个开放接口多人游戏写 adapter，验证 `AgentColonyRuntime` 不依赖 monopoly。
