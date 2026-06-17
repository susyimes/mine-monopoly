# AI 地产棋局改造方案

日期：2026-06-01  
状态：阶段 1 执行中，M2 动作落地已验证
范围：技术性、产品性与工程落地评估；内容包装和直播接入暂缓。

## 结论

下一轮不要重写游戏规则，也不要先把规则迁到服务端。最稳路线是保留现有“房主浏览器持有规则”的架构，在仓库根目录新增独立的 `tools/ai-live`，用浏览器自动化创建房间、加入 bot、开局并驱动规则策略。

阶段 1 的核心交付是“本地自动 AI 对局工程”：

- 一条命令检查本地服务是否可用。
- 自动创建房间、选择地图、设置短回合时间。
- 4 个 AI 玩家加入并准备。
- 规则 bot 能投骰、买地、升级，并能在异常时兜底。
- 生成结构化日志、截图和运行摘要。

该路线天然支持“真人玩家 + AI 玩家”混合局：bot 与真人都作为普通客户端接入房主浏览器，只是 bot 的输入由自动策略产生。当前阶段先跑全 AI 自动局；混合真人局验收已取消，保留工具兼容能力但不作为近期计划。

M2 已完成动作落地验证：在 `?automation=1` 下，客户端向 bot-runner 暴露极薄协议桥，bot 直接调用 `rollDice`、`buyProperty`、`buildHouse` 和 `animationComplete`，同时记录客户端收发的 `SocketMessage`。规则局 `m2rules5` 与 Mimo 4-agent 局 `m2mimo1` 均已通过，实测观测到投骰、买地和动画完成，决策记录显示 `source: "automation-bridge"` 且 `dispatched: true`；`buildHouse` 路径已接入，等待长局或定向场景触发复核。

## 现状判断

### 技术现状

当前游戏不是传统服务端权威架构：

- `monopoly-server` 主要提供 API、房间路由和 PeerJS 信令。
- `RoomRouter` 负责 `roomId -> hostPeerId` 登记。
- `PeerServer` 运行在 `85` 端口，负责连接发现。
- 房主浏览器创建 `MonopolyHost`。
- 游戏主循环和规则在 `GameProcessWorker` 内执行。
- 普通玩家通过 PeerJS `DataConnection` 向房主发送 `SocketMessage(JSON)`。

因此 bot 不应该直接改数据库或调用 REST 推进棋局。正确挂载点是模拟一个普通玩家客户端。

### 产品现状

现有游戏已经具备 AI 自动对局需要的基础：

- 回合循环
- 投骰
- 买地
- 升级
- 过路费
- 机会卡
- 破产和结算
- 玩家卡片
- 游戏记录

短板不是“能不能玩”，而是 AI 自动跑起来后是否足够可读：

- 用户要能快速判断谁领先。
- 用户要能看懂刚才发生了什么。
- 4 个 AI 策略要能产生明显差异。
- 回合等待不能太长。
- 卡住时要能定位原因。

## 去品牌化本轮处理

已完成第一轮用户可见文案替换：

- 客户端页面标题：`AI地产棋局`
- 登录页标题：`棋局通行证`
- 管理台标题：`地产棋局控制台`
- 首页主标题：`AI地产棋局`
- 登录页内部标题：`棋局通行证`
- 管理台顶部标题：`地产棋局控制台`
- 删除首页中已注释但仍保留旧项目外链的代码块。

暂不处理：

- 包名、目录名、数据库名。
- `global.config.ts` 内部变量名。
- 字体、模型、音乐、图片 CDN 域名。
- PeerJS STUN/TURN 旧域名。

理由：这些属于运行依赖或技术标识，直接替换会破坏本地闭环。后续公开化之前再做资产和基础设施替换。

## 推荐架构

```text
本地服务栈
  ├─ MySQL 3306
  ├─ user-server 83
  ├─ monopoly-server 84
  ├─ PeerServer 85
  └─ client dist 80

tools/ai-live
  ├─ preflight
  ├─ browser pool
  ├─ room coordinator
  ├─ bot players
  ├─ rules policy
  ├─ event recorder
  └─ run summary

浏览器房主
  ├─ MonopolyHost
  └─ GameProcessWorker
```

优先路线：

1. 房主用现有页面创建房间。
2. bot-runner 启动多个浏览器上下文。
3. 每个上下文写入不同游客身份。
4. bot 走极薄 automation bridge，UI 点击仅作为 bridge 不可用时的兼容兜底。
5. 规则稳定后再接 LLM policy。

混合局兼容路线（当前暂缓验收）：

- `AI_LIVE_BOT_COUNT` 表示 AI 玩家数量，而不是房间总人数。
- 真人玩家沿用现有网页入口进入房间并 ready。
- room coordinator 创建房间后先等待真人玩家，在超时或人数不足时再按配置补齐 bot。
- 真人玩家不进入 bot decision-loop，只记录事件、状态和截图。

暂不优先：

- 纯 Node PeerJS bot。
- 服务端化 `GameProcessWorker`。
- 重构房间协议。
- 新增复杂规则。

## 目录规划

建议新增：

```text
tools/ai-live/
  package.json
  tsconfig.json
  .env.example
  src/
    cli.ts
    config.ts
    runner/
      preflight.ts
      browser-pool.ts
      room-coordinator.ts
      local-stack.ts
    bot/
      bot-player.ts
      decision-loop.ts
      personalities.ts
    policy/
      types.ts
      rules-policy.ts
      llm-policy.stub.ts
    protocol/
      socket-types.ts
      actions.ts
    recorder/
      event-recorder.ts
      run-summary.ts
    logging/
      logger.ts
  tests/
    smoke.spec.ts
  logs/
```

原则：

- 第一轮尽量不改 `monopoly-client`。
- 不改 `GameProcessWorker` 规则。
- 不把 bot 逻辑塞进前端工程。
- 如需复用协议，先复制最小 enum/interface 到 `tools/ai-live/src/protocol`。
- 如果 UI 自动化太脆，再加可开关的 `?automation=1` bridge。

## 命令规划

```powershell
cd D:\mine-monopoly-ai-live\tools\ai-live
corepack yarn install
corepack yarn stack:check
corepack yarn run:rules --room ai001 --bots 4 --headful
corepack yarn run:rules --room mimo001 --bots 4 --policy mimo --headful=false --round-time 5 --mimo-config D:\memsuOS\.memsuos\model-providers.local.json
corepack yarn test:smoke
corepack yarn report:last
```

命令含义：

- `stack:check`：检查 `80/83/84/85/3306`、地图列表、房间路由。
- `run:rules`：启动房主和 4 个 bot，自动开局并运行规则或 Mimo 策略。
- `test:smoke`：跑 3 到 5 分钟，验证至少发生一次投骰或买地。
- `report:last`：汇总最近一次运行日志、错误和截图。

## 配置规划

```text
AI_LIVE_CLIENT_URL=http://localhost/
AI_LIVE_MONOPOLY_API=http://localhost:84
AI_LIVE_PEER_HOST=localhost
AI_LIVE_PEER_PORT=85
AI_LIVE_ROOM_ID=ai001
AI_LIVE_BOT_COUNT=4
AI_LIVE_HUMAN_COUNT=0
AI_LIVE_HUMAN_WAIT_TIMEOUT_MS=120000
AI_LIVE_HEADFUL=1
AI_LIVE_POLICY=rules
AI_LIVE_DECISION_TIMEOUT_MS=3000
AI_LIVE_ROUND_TIME=8
AI_LIVE_MAP_ID=auto
AI_LIVE_LOG_LEVEL=info
```

## Bot 最小协议

第一版 bot 需要支持的发送动作：

| 动作 | 消息 |
| --- | --- |
| 加入房间 | `JoinRoom` |
| 心跳 | `Heart` |
| 准备 | `ReadyToggle` |
| 游戏加载完成 | `GameInitFinished` |
| 投骰 | `RollDiceResult`，data 为 `OperateType.RollDice` |
| 动画完成 | `Animation`，data 为 `OperateType.Animation + walkId` |
| 买地 | `BuyProperty`，extra 为 `true/false` |
| 升级 | `BuildHouse`，extra 为 `true/false` |
| 机会卡 | 第一版默认跳过，仅预留 |

需要消费的消息：

- `RoomInfo`
- `GameStart`
- `GameInit`
- `GameInfo`
- `RoundTurn`
- `RemainingTime`
- `RollDiceStart`
- `RollDiceResult`
- `PlayerWalk`
- `PlayerTp`
- `BuyProperty`
- `BuildHouse`
- `GameLog`
- `GameOver`

最小状态机：

```text
Idle
-> Routing
-> ConnectingPeer
-> JoiningRoom
-> Lobby
-> Ready
-> LoadingGame
-> Playing
-> MyTurnDeciding
-> WaitingDiceResult
-> WaitingArriveDecision
-> Ended
```

## 规则策略 MVP

4 个 AI 玩家先用参数化策略，不急着接大模型：

| 角色 | 买地倾向 | 升级倾向 | 现金保留 | 机会卡 |
| --- | --- | --- | --- | --- |
| 激进型 | 高 | 中高 | 低 | 暂缓 |
| 保守型 | 低 | 中 | 高 | 暂缓 |
| 升级型 | 中 | 高 | 中 | 暂缓 |
| 扰动型 | 中 | 低 | 中 | 后续优先试 ToSelf/ToOtherPlayer |

第一版动作规则：

- 轮到自己：直接投骰。
- 买地：现金大于地价加保底现金则买。
- 升级：现金大于升级成本加保底现金则升级。
- 机会卡：默认不用，避免目标选择卡住。
- 剩余时间低于 2 秒：触发兜底动作。

## 产品改造 MVP

不做大 UI 重构，只补可读性：

1. 当前行动摘要  
   显示“谁的回合、骰子点数、落到哪里、是否买地/升级、现金变化”。

2. 最近事件常驻  
   将最近 3 到 5 条 `GameLog` 常驻在游戏画面一角，减少用户理解成本。

3. 策略差异可见  
   显示每个 AI 的策略标签，例如“激进买地”“现金保守”“升级优先”。

4. 快速节奏  
   AI 对局默认回合时间 5 到 8 秒，减少空白等待。

5. 自评指标  
   每局记录总回合、平均回合时长、领先者变化、破产次数、卡住次数、人工介入次数。

## 日志与验收

每次运行生成：

```text
tools/ai-live/logs/20260601-230000-ai001/
  events.jsonl
  decisions.jsonl
  browser-console.jsonl
  errors.jsonl
  summary.md
  screenshots/
  traces/
```

阶段 1 通过标准：

- 能自动进入房间。
- 4 个 bot 均 ready。
- 房主自动开始游戏。
- 至少运行 30 分钟不需要人工救场。
- 至少发生投骰、买地或升级事件。
- 出错时有截图和日志可复盘。
- 用户能在 5 秒内判断“谁领先、刚才发生了什么”。

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| Node 端 WebRTC 不稳 | 第一版用浏览器上下文，不赌纯 Node PeerJS |
| UI 自动化脆弱 | 必要时加 `?automation=1` bridge |
| 游戏初始化等待所有玩家 | bot 必须进入游戏并发送 `GameInitFinished` |
| 动画确认拖慢 | bridge 记录客户端渲染完成的 `AnimationComplete`，超时动画由 bot 兜底确认 |
| 机会卡目标复杂 | 第一版默认不用卡 |
| 游戏太久不结束 | 阶段 1 锁定明确胜利条件和快速回合 |
| 原资产仍依赖旧 CDN | 阶段 1 本地自评暂保留，公开前进入资产替换 |

## 任务拆分

### M1：自动房间

- 新建 `tools/ai-live`。
- 实现 `stack:check`。
- 启动房主浏览器。
- 写入游客身份。
- 创建房间、选择默认地图、设置 8 秒回合。
- 4 个 bot 加入并 ready。
- 已保留 `--humans 1 --bots 3` 等待真人 ready 的兼容能力；当前取消该验收计划。

### M2：规则 bot

- 已实现投骰。
- 已实现买地 true/false。
- 已实现升级 true/false 桥接路径，等待长局或定向场景触发复核。
- 已实现 `GameInitFinished` 和 `AnimationComplete` 兜底动作。
- 先跳过机会卡。

验收记录：

- 规则局 `m2rules5`：124 events、12 decisions、36 player movements、32 animation-complete，全部决策经 automation bridge 下发。
- Mimo 局 `m2mimo1`：91 events、7 decisions、24 player movements、20 animation-complete，4 个 bot 使用本机 memsuOS Mimo 配置进行真实决策。

### M3：稳定性

- JSONL 日志。
- console 日志。
- 卡住检测。
- 截图和 trace。
- 3 到 5 分钟 smoke test。

### M4：产品可读性

- 当前行动摘要。
- 最近事件常驻。
- AI 策略标签。
- 对局 summary。

### M5：LLM 策略

- 只接买地、升级、机会卡这些关键决策。
- 输出必须是结构化 JSON。
- 超时或非法输出立即回落规则策略。
- 已接入 `--policy mimo`：从 `D:\memsuOS\.memsuos\model-providers.local.json` 读取本机 Mimo provider 配置，使用 `api-key` header 调用 OpenAI 兼容 `chat/completions`；实测 4 bot 自动局可产出 Mimo 中文决策理由，失败请求回落规则。

## 下一步

建议下一次直接开始 M1：

1. 创建 `tools/ai-live` 工程。
2. 写 `stack:check`。
3. 用 Playwright 打开房主页面并自动进入房间。
4. 将 4 个 bot 身份写入不同浏览器上下文。
5. 先做到“自动进入房间并 ready”。
