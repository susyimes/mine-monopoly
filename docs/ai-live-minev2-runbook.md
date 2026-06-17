# minev2 AI Live 运行记录

日期：2026-06-17

目标：以 `susyimes/mine-monopoly` 新版主干为唯一游戏基线，保留 `tools/ai-live` agent 控制层，验证 HostBot/Bot1 + Bot2/Bot3/Bot4 四 bot 对局可稳定跑 30 分钟或 GameOver。

## 当前代码状态

- 新版 client 已暴露 `?automation=1` bridge，agent 可通过真实客户端 API 执行掷骰、买地/升级确认、机会卡、动态按钮和动画完成。
- bridge snapshot 已归一化新版字段：
  - 地产 owner 同时提供 `userId/username` 和兼容 agent 的 `id/name`。
  - 机会卡同时提供新版 `description/iconId` 和兼容 agent 的 `describe/icon`。
  - 地产等级兼容 `level` 与 `buildingLevel`。
- automation 页面会跳过非核心阻塞弹窗，并给目标选择、物品选择、表单弹窗提供默认回复。
- `tools/ai-live` 默认端口已对齐新版本地栈：client `5173`、API `8181`、Peer `8182`、MySQL `3307`。
- `docker/docker-compose.yml` 已补 MySQL 8 服务，宿主机端口 `3307`，并让 server 等待 MySQL healthcheck。

## 已验证

```powershell
cd D:\mine-monopoly-ai-live\apps\client
..\..\node_modules\.bin\vue-tsc.cmd --noEmit

cd D:\mine-monopoly-ai-live\tools\ai-live
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\playwright.cmd test tests/mimo-policy.spec.ts tests/build-house-colony.spec.ts tests/asset-issues.spec.ts
```

结果：

- client typecheck 通过。
- ai-live typecheck 通过。
- Mimo policy / BuildHouse bridge / ChanceCard bridge / asset issue 共 5 个 Playwright 定向测试通过。
- `docker compose -f docker\docker-compose.yml --env-file docker\.env.example config` 通过。

## 本地栈启动

Docker daemon 当前未运行时，先启动 Docker Desktop。然后：

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

如果 `pnpm` / `npm` 不在 PATH，先通过 Corepack 或本机 Node 工具链恢复包管理器入口。

## 30 分钟 / GameOver Mimo 实跑

服务全部通过 `stack:check` 后：

```powershell
cd D:\mine-monopoly-ai-live\tools\ai-live
npm run run:mimo30 -- --room mimo30
```

预期：

- 直播窗口只保留 HostBot/Bot1 视角。
- 总玩家为 Bot1 + Bot2 + Bot3 + Bot4。
- 日志中应出现 `source: "automation-bridge"` 的掷骰、买地/升级、机会卡和动画完成记录。
- 运行结束条件为 GameOver 或 30 分钟 timeout。

## 2026-06-17 实跑结果

### 3 分钟冒烟

- room：`smk123246`
- runDir：`tools/ai-live/logs/20260617-123246-smk123246`
- status：`passed`
- duration：约 3 分 30 秒
- decisions：49
- errors：0
- 结果：开局、移动、买地、动画完成均正常；无重连洪水、无 worker safe mode。

### 正式 Mimo 四 bot 局

- room：`m30123719`
- runDir：`tools/ai-live/logs/20260617-123719-m30123719`
- status：`passed`
- ended reason：`game-over`
- duration：957672 ms，约 15 分 57 秒
- decisions：238
- events：647
- screenshots：17
- errors：0
- 机会卡决策：9 次，已验证 agent 可实际使用机会卡。
- 买地决策：24 次。

结论：本轮满足阶段 1 的“30 分钟或 GameOver”目标，实际跑到 GameOver。HostBot/Bot1 + Bot2 + Bot3 + Bot4 的 Mimo 对局链路可运行，直播视角为 Bot1/房主页面。

## 直播画面观察

- 画面不是空白或 loading，棋子、骰子、排行榜、Recent overlay、购买/机会卡提示都在刷新。
- Host1 未出现在直播展示中，房主视角统一为 `MemsuBot1/Bot1`。
- 地图主体可看，但 legacy map 仍偏灰、偏占位，视觉质感不像正式直播素材。
- overlay 与游戏原生 UI 偶尔挤在一起，尤其是购买弹层、中央回合提示、右侧玩家栏同时出现时。
- 一些地块/玩家标签会被建筑遮挡或透视压缩，远景阅读性一般。
- 右上角 FPS 稳定显示约 57 FPS；录制链路看起来没有明显卡死。

## 后续待改清单

- 结束时 `setRoomStarted(false)` 可能因为房间状态已清理返回 400；代码已改为 warning 容错，避免污染 fatal error panel，后续可补服务端幂等。
- live overlay 需要做避让：购买/机会卡弹层出现时，左上/左下 overlay 不应遮挡关键 UI。
- legacy map 需要更适合直播的视觉包：更明确的材质、颜色分区、地块名可读性、镜头默认距离。
- 机会卡和地图事件日志可以更精简；目前浏览器 console 仍有不少性能/纹理生成噪声。
- 角色选择目前能保证四玩家入局，但角色/颜色唯一性仍应进一步校验，避免截图里多个 bot 看起来相同。
- GameOver 后 runner 已写 summary，但外层 Windows `cmd` 偶尔残留；需要继续收紧子进程退出/清理。
