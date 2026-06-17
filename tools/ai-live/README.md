# AI Live 工具

本目录承接 `docs/ai-live-remodel-plan.md` 的阶段 1 工程落地：本地服务预检、浏览器房主、bot 玩家、规则策略、结构化日志和运行报告。混合局能力保留为兼容选项，当前不作为验收计划。

M2.5 已新增可迁移的 `AgentColonyRuntime` 抽象，位于 `src/colony/`。当前 `monopoly` 是第一个 `GameAdapter`，实现位于 `src/adapters/monopoly/automation-bridge-adapter.ts`；后续其它开放接口多人游戏只需要实现自己的 adapter。

## 安装

```powershell
cd D:\mine-monopoly-ai-live\tools\ai-live
npm install
```

默认使用本机 Chrome channel 运行 Playwright。如果需要 Playwright 自带 Chromium，可以执行 `npx playwright install chromium`，并设置 `AI_LIVE_BROWSER_CHANNEL=bundled`。

## 命令

```powershell
npm run stack:check
npm run test:build-house
npm run run:rules -- --room ai001 --bots 4 --humans 0 --headful=false --round-time 8 --client-url http://localhost:5173
npm run run:rules -- --room mimo001 --bots 4 --humans 0 --policy mimo --headful=false --round-time 12 --client-url http://localhost:5173 --mimo-config D:\memsuOS\.memsuos\model-providers.local.json
npm run run:mimo30 -- --room mimo30
npm run typecheck
npm run test:smoke
npm run report:last
```

## 新版本地栈

ai-live 默认对齐当前新版 `.env`：客户端 `5173`、API `8181`、Peer `8182`、MySQL 宿主机端口 `3307`。完整实跑前先启动本地服务：

```powershell
cd D:\mine-monopoly-ai-live
docker network create monopoly-network
copy docker\.env.example docker\.env
docker compose -f docker\docker-compose.yml up -d fatpaper-mysql
pnpm dev-server
pnpm dev-client

cd tools\ai-live
npm run stack:check
```

如果用 Docker 跑服务端，也可以启动 `monopoly-server`；前端开发服务器仍建议用 `pnpm dev-client`，方便直播调试和热更新。

`test:smoke` 会检查本地服务：

- `AI_LIVE_CLIENT_URL`，默认 `http://localhost:5173/`
- `AI_LIVE_USER_API`，默认 `http://localhost:8181`
- `AI_LIVE_MONOPOLY_API`，默认 `http://localhost:8181`
- `AI_LIVE_PEER_HOST:AI_LIVE_PEER_PORT`，默认 `localhost:8182`
- `AI_LIVE_MYSQL_HOST:AI_LIVE_MYSQL_PORT`，默认 `localhost:3307`
- `AI_LIVE_BROWSER_CHANNEL`，默认 `chrome`；设置为 `bundled` 时使用 Playwright 自带 Chromium

服务不可用时 smoke 会清晰跳过，并列出具体不可用的地址。服务可用时，smoke 会用两个浏览器上下文：

1. 写入游客身份。
2. 房主进入大厅并创建房间。
3. 第二个游客加入同一房间。
4. 第二个游客点击准备，并验证按钮变为取消准备。

`run:rules` 会启动房主和多个 bot 浏览器上下文，自动创建房间、选择地图、设置回合秒数、等待真人或补齐 bot、ready 后开局，并运行策略循环。

本地实局优先使用 `--client-url http://localhost:5173`。部分远程模型/角色资源对 localhost 来源更友好，`127.0.0.1` 可能产生额外 CORS 噪声。

M2 已改为优先走客户端 `?automation=1` 协议桥，而不是只依赖可见按钮点击。bridge 会暴露并记录：

- `gameInitFinished`：bot 进入游戏后确认初始化完成。
- `rollDice`：轮到当前 bot 时真实发送投骰动作。
- `buyProperty` / `buildHouse`：根据策略发送买地或升级确认；新版核心中二者通过 `ConfirmDialogResult` 落地。
- `useChanceCard`：agent 读取归一化后的手牌、玩家、地产和地图项，按合法目标发送机会卡使用动作。
- `animationComplete`：记录客户端渲染完成的动画确认，必要时对超时动画做兜底确认。

M2 验收日志中，决策记录应包含 `source: "automation-bridge"` 和 `dispatched: true`。事件记录可观察 `bot.game-init-finished`、`bot.player-movement` 和 `bot.animation-complete`。

策略可选：

- `--policy rules`：本地参数化规则策略。
- `--policy llm-stub`：LLM 接口桩，当前仍回落规则。
- `--policy mimo`：读取本机 Mimo provider 配置，调用 `chat/completions` 做关键动作决策，超时、非法 JSON 或请求失败时回落规则策略。

Mimo 配置默认读取 `D:\memsuOS\.memsuos\model-providers.local.json` 的 `providers.mimo`，期望包含 `api_key`、`base_url` 和 `model`。密钥只在运行时从本机文件读取，不应提交到本仓库。可用 `AI_LIVE_MIMO_CONFIG_PATH`、`AI_LIVE_MIMO_MODEL`、`AI_LIVE_MIMO_DECISION_TIMEOUT_MS` 或同名 CLI 参数覆盖。

混合局兼容示例（当前暂缓验收）：

```powershell
npm run run:rules -- --room ai001 --humans 1 --bots 3 --headful=true --client-url http://localhost:5173
```

真人玩家从普通网页入口加入同一房间并 ready；工具只等待和记录真人状态，不接管真人输入。

远程 COS 模型、角色、音乐、图标和字体加载异常会被归类为 `asset.issue` 事件；这些问题不再进入 pageerror，避免掩盖真正的运行错误。静态路由也改为 hash-first，减少 `/room-router?automation=1` 404 噪声。

memsuOS 候选记忆默认关闭。需要把对局复盘写入本机 memsuOS 时，设置：

```powershell
$env:AI_LIVE_MEMSU_MEMORY="1"
$env:AI_LIVE_MEMSU_ROOT="D:\memsuOS"
```

写入目标是 `.memsuos/game-agent-memory.jsonl`，记录类型是 `proposed_memory`，不能授予权限或降低安全阈值。

## 日志目录

每次运行会创建：

```text
logs/<timestamp-room>/
  events.jsonl
  decisions.jsonl
  browser-console.jsonl
  errors.jsonl
  summary.json
  screenshots/
  traces/
```

`summary.json` 会记录：

- 运行状态、房间号、开始/结束时间。
- JSONL 文件路径。
- `screenshots/` 和 `traces/` 路径。
- 已记录截图的绝对路径与相对路径。
- event、decision、console、error 的计数。

## 报告

```powershell
npm run report:last
```

默认读取最近一个 `logs/<timestamp-room>/summary.json`，输出运行状态、事件计数、错误计数、截图路径和最近事件。可选参数：

```powershell
npm run report:last -- --json
npm run report:last -- --logs-root D:\tmp\ai-live-logs
npm run report:last -- --tail 20
```

## 常用环境变量

```powershell
$env:AI_LIVE_ROOM_ID="ai001"
$env:AI_LIVE_RUN_ROOT="D:\tmp\ai-live-logs"
$env:AI_LIVE_CLIENT_URL="http://localhost:5173/"
$env:AI_LIVE_MONOPOLY_API="http://localhost:8181"
$env:AI_LIVE_POLICY="mimo"
$env:AI_LIVE_MIMO_CONFIG_PATH="D:\memsuOS\.memsuos\model-providers.local.json"
```

`AI_LIVE_RUN_ROOT` 不设置时默认使用当前目录下的 `logs/`。Playwright smoke 也兼容 `AI_LIVE_LOG_ROOT`，方便单独指定测试日志目录。
