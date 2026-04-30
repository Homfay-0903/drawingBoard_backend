# 你画我猜 - 后端服务

一个基于 Node.js + Express + Socket.io 的实时多人在线"你画我猜"游戏后端服务。

## 技术栈

- **运行环境**: Node.js >= 16.x
- **开发语言**: TypeScript
- **Web框架**: Express.js
- **实时通信**: Socket.io
- **构建工具**: tsc (TypeScript Compiler)
- **开发工具**: nodemon (热重载)

## 项目架构

```
drawingBoard_backend/
├── src/
│   ├── app.ts                 # Express 应用配置
│   ├── index.ts               # 服务入口文件
│   ├── config.ts              # 配置文件
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   ├── models/                # 数据模型
│   │   ├── Player.ts          # 玩家模型
│   │   ├── Room.ts            # 房间模型
│   │   └── Game.ts            # 游戏模型
│   ├── services/              # 业务逻辑服务
│   │   ├── room.service.ts    # 房间管理服务
│   │   ├── word.service.ts    # 词语服务
│   │   └── game.service.ts    # 游戏逻辑服务
│   └── socket/                # Socket.io 相关
│       └── handlers/          # 事件处理器
│           ├── room.handler.ts   # 房间事件
│           ├── game.handler.ts   # 游戏事件
│           └── canvas.handler.ts # 画布事件
├── dist/                      # 编译输出目录
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## 核心模块说明

### 1. 数据模型 (Models)

#### Player (玩家模型)

- 玩家基本信息：ID、昵称、头像
- 游戏状态：是否准备、是否绘画中、是否已猜对
- 分数统计

#### Room (房间模型)

- 房间配置：房间名、最大玩家数、回合数、绘画时间
- 玩家管理：加入、离开、房主转移
- 房间状态：等待中、游戏中

#### Game (游戏模型)

- 游戏状态：waiting、selecting、drawing、roundEnd、gameEnd
- 回合管理：当前回合、绘画者轮换
- 计分系统：猜对者得分、绘画者得分
- 计时器管理

### 2. 服务层 (Services)

#### RoomService

- 房间创建、查询、删除
- 玩家加入、离开房间
- 房间列表广播

#### WordService

- 词语库管理
- 随机选词
- 提示生成

#### GameService

- 游戏开始、结束
- 词语选择处理
- 猜词判断
- 分数计算
- 回合管理

### 3. Socket 事件

#### 客户端 -> 服务端事件

| 事件名          | 参数                 | 说明         |
| --------------- | -------------------- | ------------ |
| room:create     | { name, maxPlayers } | 创建房间     |
| room:join       | { roomId, nickname } | 加入房间     |
| room:leave      | { roomId }           | 离开房间     |
| room:ready      | { roomId }           | 切换准备状态 |
| game:start      | { roomId }           | 开始游戏     |
| game:selectWord | { roomId, word }     | 选择词语     |
| canvas:draw     | { roomId, element }  | 同步绘画元素 |
| canvas:clear    | { roomId }           | 清空画布     |
| chat:message    | { roomId, message }  | 发送消息     |

#### 服务端 -> 客户端事件

| 事件名            | 数据                                    | 说明         |
| ----------------- | --------------------------------------- | ------------ |
| room:list         | RoomData[]                              | 房间列表     |
| room:created      | { room }                                | 房间创建成功 |
| room:joined       | { room, player }                        | 加入房间成功 |
| room:updated      | { room }                                | 房间信息更新 |
| room:error        | { message }                             | 错误信息     |
| game:started      | { gameState }                           | 游戏开始     |
| game:selectWord   | { words }                               | 选词提示     |
| game:wordHint     | { hints, length }                       | 词语提示     |
| game:tick         | { timeLeft }                            | 时间更新     |
| game:correctGuess | { playerId, playerName, score }         | 猜对通知     |
| game:roundEnd     | { word, scores }                        | 回合结束     |
| game:gameEnd      | { finalScores }                         | 游戏结束     |
| canvas:sync       | { element }                             | 画布同步     |
| canvas:cleared    | -                                       | 画布清空     |
| chat:message      | { playerId, playerName, message, type } | 聊天消息     |

## 游戏流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  等待玩家   │───>│  房主开始   │───>│  选词阶段   │
│  准备就绪   │    │    游戏     │    │  (10秒)     │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                            │
                                            ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  游戏结束   │<───│  回合结束   │<───│  绘画阶段   │
│  显示排名   │    │  显示答案   │    │  (60秒)     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 计分规则

1. **猜对者得分**
   - 基础分 = 剩余时间 × 2
   - 越早猜对得分越高

2. **绘画者得分**
   - 每有一位玩家猜对 +10 分
   - 鼓励画得清晰易懂

## 项目启动指南

### 环境要求

- Node.js >= 16.x
- npm >= 8.x

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动，支持热重载。

### 生产构建

```bash
npm run build
```

编译后的文件将输出到 `dist/` 目录。

### 生产运行

```bash
npm start
```

### 环境变量

可在 `src/config.ts` 中修改以下配置：

| 配置项      | 默认值                | 说明         |
| ----------- | --------------------- | ------------ |
| PORT        | 3000                  | 服务端口     |
| CORS_ORIGIN | http://localhost:5173 | 允许的前端源 |

## API 接口

### REST API

#### GET /api/health

健康检查接口

**响应示例:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/rooms

获取房间列表

**响应示例:**

```json
[
  {
    "id": "room-xxx",
    "name": "快乐画图",
    "hostId": "player-xxx",
    "players": [...],
    "maxPlayers": 8,
    "status": "waiting"
  }
]
```

## 开发注意事项

1. **类型安全**: 项目使用 TypeScript，请确保类型定义完整
2. **错误处理**: 所有 Socket 事件都应有错误处理和日志记录
3. **内存管理**: 游戏结束后及时清理 Game 实例，避免内存泄漏
4. **并发处理**: 注意多玩家同时操作时的状态一致性

## 扩展建议

1. **数据库集成**: 添加 MongoDB/MySQL 存储玩家数据、游戏记录
2. **用户认证**: 实现登录注册、JWT 认证
3. **房间持久化**: 游戏中断后可恢复
4. **词语库扩展**: 支持自定义词语、难度分级
5. **排行榜**: 实现全服排行榜功能

## 许可证

MIT License
