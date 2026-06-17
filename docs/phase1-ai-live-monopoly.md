# 阶段 1：AI 大富翁直播原型

状态：阶段 1 执行中，M2 已验证
日期：2026-06-01  
基线：阶段 0 已在 `D:\mine-monopoly` 跑通本地开局。

## 目标

阶段 1 的目标是把阶段 0 的“本地能玩”推进为“本地可录制、可评审、可小范围试播”的 AI 对局原型。

成功状态不是上线直播，而是能稳定产出一段 10 到 20 分钟的可观看对局录屏：4 个 AI 玩家有可辨认的人设和策略，画面可读，旁白能解释局势，系统在本地连续运行时不会频繁卡死或需要人工救场。

## 阶段 0 输入

已确认事实：

- `monopoly-client` 能在 `http://localhost/` 进入游客身份、创建房间、选择“小镇富翁”并开始游戏。
- 本地运行方式可用：MySQL 容器 `monopoly-mysql`、用户服务 `83`、大富翁 API `84`、PeerJS 信令 `85`、前端静态站点 `80/81/82`。
- `RoomRouter` 只负责 `roomId -> hostPeerId` 登记。
- `PeerServer` 只负责 PeerJS 信令。
- 房主浏览器持有 `MonopolyHost` 与 `GameProcessWorker`，游戏规则和回合推进主要在房主浏览器 worker 内运行。
- 玩家客户端通过 PeerJS `DataConnection` 发送 JSON 形态的 `SocketMessage`。
- bot 的优先挂载点应模拟 `MonopolyClient` 客户端，而不是只调用后端 REST。

阶段 0 留下的工程修复：

- 三个 Vite visualizer 配置已改为 `open: false`，避免容器构建时尝试打开本机浏览器。
- `monopoly-server` 已放行 `/health`，避免健康检查被鉴权中间件拦截。

## 范围

阶段 1 包含：

- 最小 AI 玩家客户端。
- 本地房间自动创建、自动加入、自动开始。
- 4 个可区分人设 prompt。
- 规则兜底策略：LLM 超时、输出非法或 API 不可用时，仍能继续行动。
- 轻量旁白系统：把关键事件转成中文解说文本。
- 去品牌化方案初版：直播标题、玩家名、提示词、画面露出文字的替换清单。
- 本地录屏验收流程。

阶段 1 不包含：

- 正式 B 站开播。
- 弹幕互动闭环。
- TTS 最终音色和商业授权选型。
- 内容安全完整审核层。
- 云端部署与公网房间。
- 对原游戏美术资产的最终替换。

## 架构

阶段 1 采用“房主浏览器 + bot 客户端 + 旁白进程”的本地架构。

```text
monopoly-client host page
  ├─ MonopolyHost
  ├─ GameProcessWorker
  └─ PeerJS DataConnection
        ▲
        │ SocketMessage(JSON)
        ▼
bot-runner
  ├─ room coordinator
  ├─ bot player x4
  ├─ policy adapter
  │   ├─ rules fallback
  │   └─ remote LLM provider
  └─ event recorder

narrator
  ├─ event summarizer
  └─ commentary text output
```

优先实现路径：

1. 先做 headless browser bot，直接复用浏览器内已有 PeerJS 与前端运行环境。
2. 在消息形态稳定后，再评估是否下沉为纯 Node PeerJS 客户端。
3. 如果 Node WebRTC 依赖在 Windows 上不稳定，阶段 1 不强行迁移，保留 headless browser 作为可交付实现。

## 消息与动作边界

bot 必须能处理这些输入事件：

- `RoomInfo`：同步房间状态、玩家列表、地图设置。
- `GameStart`：进入游戏。
- `GameInit`：读取初始棋局信息。
- `GameInfo`：同步当前回合、玩家资产、地块状态。
- `RoundTurn` / `RemainingTime`：判断是否轮到自己行动。
- `BuyProperty` / `BuildHouse`：处理购买和升级决策。
- `GameLog`：记录事件并供旁白消费。
- `GameOver`：结束本局并输出总结。

bot 第一版必须能发送这些动作：

- `JoinRoom`
- `Heart`
- `ReadyToggle`
- `RollDiceResult`
- `BuyProperty`
- `BuildHouse`
- `UseChanceCard`
- `RoomChat`（可选，用于角色台词）

## AI 玩家人设

阶段 1 固定 4 个玩家：

| 玩家 | 策略倾向 | 风格 |
| --- | --- | --- |
| 激进炒房客 | 高杠杆买地、优先升级、现金阈值低 | 冒险、嘴硬、爱押注 |
| 稳健会计 | 保留现金、只买高性价比地块 | 冷静、算账、少废话 |
| 老赖赌徒 | 爱用机会卡、偏好破坏和拖延 | 滑头、挑衅、赖账 |
| 慈善富豪 | 偏好帮助弱者、低攻击性 | 温和、戏剧化善良 |

每个玩家的 LLM 输出只允许返回结构化动作，不直接信任自然语言：

```json
{
  "action": "buy_property",
  "decision": true,
  "reason": "现金充足，当前地块回本周期可接受"
}
```

非法输出处理：

- JSON 解析失败：使用规则兜底。
- action 不在合法集合：使用规则兜底。
- 决策超时：使用规则兜底。
- 连续失败 3 次：该玩家本局切换为纯规则 bot。

## 旁白

旁白第一版只产出文字，不接 TTS。

输入来源：

- `GameLog`
- `GameInfo`
- bot 决策 reason
- 关键资产变化：现金、房产、破产、领先者变化

输出形式：

- `logs/commentary-YYYYMMDD-HHmmss.md`
- 控制台实时打印
- 后续可接入 OBS 文本源或 TTS

旁白风格：

- 口语化中文。
- 每 10 到 30 秒输出一句。
- 不解释底层技术。
- 不使用真实品牌名和敏感梗。

## 去品牌化清单

阶段 1 先做可逆替换，不深度重绘。

必须替换：

- 页面标题中的旧项目品牌名。
- 房间名和玩家默认名。
- 直播标题、录屏文件名、旁白口径。
- prompt 中对“Monopoly/大富翁”商标的直接引用，统一改为“地产棋局”“环形地产对局”等描述。

暂缓替换：

- 角色模型。
- 地图图片。
- 道具图标。
- 历史数据库中的中文梗内容。

阶段 1 录屏只用于内部自评；公开传播前进入阶段 2 的资产替换和内容审核。

## 里程碑

### M1：自动房间

交付物：

- 一条命令启动本地运行环境。
- 自动创建房主页面。
- 自动创建或加入指定房间。
- 4 个 bot 进入房间并 ready。

验收：

- 无人工点击即可进入待开局状态。
- 失败时能输出明确错误：端口占用、服务未启动、Peer 连接失败、地图数据缺失。

### M2：规则 bot 完整对局

交付物：

- 规则 bot 可以完成投骰、买地、升级、使用或跳过机会卡。
- 游戏可以从开局跑到结束或至少稳定运行 30 分钟。
- 已落地 `?automation=1` 客户端协议桥，bot 可真实发送 `GameInitFinished`、投骰、买地、升级选择和 `AnimationComplete`；M2 实测局已观测投骰、买地和动画完成，升级等待长局或定向场景复核。

验收：

- bot 不因单个非法状态卡住整局。
- 每个决策都有日志。
- 超时会自动执行安全动作。

当前状态：

- 规则局 `m2rules5` 已通过：124 条事件、12 条决策、36 次玩家移动、32 次动画完成，决策均为 `automation-bridge` 下发。
- Mimo 4-agent 局 `m2mimo1` 已通过：91 条事件、7 条 Mimo 决策、24 次玩家移动、20 次动画完成，密钥仅从本机 memsuOS 配置运行时读取。
- 机会卡仍按阶段 1 MVP 暂缓。混合真人局验收已按当前项目判断取消，`--humans` 能力保留但不作为阶段 1 当前验收项。

### M3：LLM 策略适配器

交付物：

- 统一的 `PolicyAdapter` 接口。
- 远端 LLM provider。
- prompt 模板和结构化输出校验。
- 每个人设接入同一动作协议。

验收：

- LLM 成功时使用模型决策。
- LLM 失败时回落规则 bot。
- 单次决策预算可配置，默认不超过 8 秒。

### M4：旁白与录屏

交付物：

- 事件转旁白文本。
- 一段 10 到 20 分钟本地录屏。
- 自评记录：节奏、角色辨识度、可看性、卡顿点。

验收：

- 观众不看代码也能理解局势。
- 4 个角色至少有 2 个能被明显区分。
- 录屏中没有需要人工救场的长时间空白。

## 文件建议

阶段 1 新增代码建议放在独立目录，避免过早侵入上游子模块：

```text
tools/ai-live/
  package.json
  src/
    runner/
    bot/
    policy/
    narrator/
    protocol/
  prompts/
  logs/
```

只有当协议稳定后，再考虑把可复用类型抽回 `monopoly-client` 或单独包。

## 本地运行约定

阶段 1 默认沿用阶段 0 的本地服务：

- MySQL：`monopoly-mysql`，端口 `3306`
- 用户服务：`http://localhost:83`
- 大富翁 API：`http://localhost:84`
- PeerJS：`http://localhost:85`
- 客户端：`http://localhost/`

环境变量建议：

```text
AI_LIVE_ROOM_ID=ai001
AI_LIVE_BOT_COUNT=4
AI_LIVE_POLICY=rules
AI_LIVE_DECISION_TIMEOUT_MS=8000
AI_LIVE_MIMO_CONFIG_PATH=D:\memsuOS\.memsuos\model-providers.local.json
AI_LIVE_MIMO_MODEL=mimo-v2.5-pro
AI_LIVE_MIMO_DECISION_TIMEOUT_MS=20000
```

AI 自动对局工具示例：

```powershell
cd D:\mine-monopoly-ai-live\tools\ai-live
npm install
npm run stack:check
npm run test:build-house
npm run run:rules -- --room ai001 --bots 4 --humans 0 --headful=false --round-time 8 --client-url http://localhost
npm run run:rules -- --room mimo001 --bots 4 --humans 0 --policy mimo --headful=false --round-time 12 --client-url http://localhost --mimo-config D:\memsuOS\.memsuos\model-providers.local.json
npm run report:last
```

实局验证优先使用 `http://localhost`。部分远程模型/角色资源对 `localhost` 来源更稳定，`127.0.0.1` 会引入不影响核心对局但干扰日志的 CORS 噪声。

## 风险

PeerJS 客户端风险：

- Node 端 WebRTC 依赖可能在 Windows 上安装或运行不稳。
- 缓解：阶段 1 允许使用 headless browser bot，先保交付闭环。

规则状态风险：

- 游戏规则在 `GameProcessWorker` 内，外部 bot 看到的状态可能不完整。
- 缓解：先用客户端可见的 `GameInfo` 和操作请求驱动，不直接重写规则。

内容风险：

- 原数据库含有较多中文梗和品牌化文本。
- 缓解：阶段 1 仅内部录屏；公开前必须进入阶段 2 内容清洗。

观赏性风险：

- 纯策略对局可能不够好看。
- 缓解：旁白强调冲突、领先变化和角色性格；prompt 允许角色在安全范围内表达立场。

成本风险：

- 每回合调用 LLM 会产生延迟和费用。
- 缓解：只在关键决策调用 LLM；简单动作使用规则；缓存局势摘要。

## 阶段 1 验收标准

阶段 1 完成时必须满足：

- 一条命令或一份 runbook 可复现本地运行。
- 4 个 AI 玩家能进入同一局。
- 至少一局能自动运行 30 分钟，或完整跑到 `GameOver`。
- 关键动作有结构化日志。
- 至少产出一份旁白文本文件。
- 至少产出一段 10 到 20 分钟录屏。
- 明确列出进入阶段 2 前必须处理的资产、内容安全和直播接入事项。

## 阶段 2 入口条件

只有当阶段 1 录屏被认为“可看”后，才进入阶段 2。

阶段 2 重点是：

- TTS 与 OBS 接入。
- 弹幕输入和提示注入隔离。
- 内容审核与违禁词过滤。
- 去品牌化资产替换。
- 小范围私密试播。
