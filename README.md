# MineMonopoly

<div align="center">

<img src="docs/images/client-logo.png" alt="MineMonopoly Logo" width="120"/>
<img src="docs/images/editor-logo.png" alt="MineMonopoly Editor Logo" width="120"/>

**支持自定义地图的多人在线大富翁游戏**
支持 Web 和 Electron 桌面端

[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.5.18-brightgreen)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.10.0-red)](https://pnpm.io/)

</div>

## 简介

MineMonopoly 是一个基于 pnpm workspaces 的 monorepo 架构多人在线大富翁游戏。采用混合 P2P 架构——中央服务器负责认证和房间路由，游戏逻辑由主机客户端运行，其他玩家通过 WebRTC (PeerJS) 点对点连接，实现低延迟、高可扩展的游戏体验。

项目提供完整的地图编辑器，支持创建**自定义地图**和**游戏事件**，同时支持 Web 浏览器和 Electron 桌面端双平台运行。

## 技术架构

### 核心技术栈

- **前端**: Vue 3 + TypeScript + Vite + Pinia
- **后端**: Express + TypeORM + MySQL
- **渲染**: Three.js + PIXI.js
- **通信**: PeerJS (WebRTC) + Socket.io
- **桌面端**: Electron
- **构建**: pnpm workspaces

## 核心特性

### 🗺️ 强大的地图编辑器 <img src="docs/images/editor-logo.png" alt="Editor" width="20" vertical-align="middle"/>

- **可视化编辑** - 拖拽式创建地图，所见即所得
- **丰富的事件系统** - 配置触发器、条件判断、奖励惩罚
- **角色与阶段配置** - 自定义角色属性和游戏阶段规则
- **地图数据库** - 地图存储在云端，轻松分享和管理
- **高效序列化** - Protocol Buffers 编码，加载速度飞快

### 🌐 混合 P2P 架构

- 中央服务器负责认证和房间匹配
- 游戏逻辑在主机客户端运行（Web Worker 独立进程）
- 玩家间 WebRTC 直连，低延迟同步

### 🎮 多平台游戏

- Web 浏览器即开即玩
- Electron 桌面应用，支持自动更新
- TypeScript 全栈类型安全

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10.10.0+
- MySQL 8.0+

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/mine-monopoly.git
cd mine-monopoly

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库等信息
```

### 运行项目

```bash
pnpm dev-client    # 客户端 http://localhost:5173
pnpm dev-server    # 服务器
pnpm dev-editor    # 地图编辑器
```

### 构建应用

```bash
pnpm build-client    # 构建客户端
pnpm build-editor    # 构建地图编辑器
```

构建产物在对应应用的 `dist` 目录。

### 项目结构

```
mine-monopoly/
├── apps/
│   ├── client/         # 游戏客户端
│   ├── server/         # 游戏服务器
│   ├── admin/          # 管理后台
│   └── map-editor/     # 地图编辑器
├── packages/
│   ├── types/          # 共享类型定义
│   ├── env/            # 环境变量
│   ├── utils/          # 共享工具
│   └── components/     # 共享组件
└── docs/               # 项目文档
```

### 架构亮点

- **Monorepo 管理** - pnpm workspaces 统一依赖和构建
- **类型共享** - 全栈 TypeScript 类型复用
- **模块化设计** - 应用间解耦，包按需引用

## 开发指南

详细的开发指南请查看：
- [开发指南](docs/development-guide.md) - 架构设计、关键概念、开发规范
- [游戏进程 API](docs/game-process-api.md) - 游戏进程接口文档

## 贡献

欢迎贡献代码、报告问题或提出建议！

### 报告问题

请在 [Issues](https://github.com/your-org/mine-monopoly/issues) 中报告 bug 或提出功能请求。

### 提交代码

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m '添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

请遵循项目的开发规范，详见 [开发指南](docs/development-guide.md)。

## 许可证

本项目采用 [ISC](LICENSE) 许可证。
