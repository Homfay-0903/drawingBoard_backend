import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app'
import { config } from './config'
import { testConnection } from './database'
import { authService } from './services/auth.service'
import { RoomHandler } from './socket/handlers/room.handler'
import { GameHandler } from './socket/handlers/game.handler'
import { CanvasHandler } from './socket/handlers/canvas.handler'
import { createGameService } from './services/game.service'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
} from './types'

const httpServer = createServer(app)

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: config.cors.methods,
    credentials: config.cors.credentials
  }
})

// Socket.io JWT 认证中间件
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) {
    return next(new Error('认证失败：未提供令牌'))
  }

  const payload = authService.verifyToken(token)
  if (!payload) {
    return next(new Error('认证失败：令牌无效'))
  }

  // 从数据库获取用户信息
  const user = await authService.getUserById(payload.userId)
  if (!user) {
    return next(new Error('认证失败：用户不存在'))
  }

  // 将用户信息写入 socket.data
  socket.data.userId = user.id
  socket.data.playerId = `user_${user.id}`
  socket.data.nickname = user.nickname
  socket.data.avatar = user.avatar
  socket.data.roomId = null

  next()
})

const gameService = createGameService(io as any)
const roomHandler = new RoomHandler(io as any)
const gameHandler = new GameHandler(io as any, gameService)
const canvasHandler = new CanvasHandler(io as any, gameService)

io.on('connection', (socket) => {
  console.log(`[Socket] 用户连接: ${socket.data.nickname} (${socket.data.playerId})`)

  roomHandler.registerHandlers(socket as any)
  gameHandler.registerHandlers(socket as any)
  canvasHandler.registerHandlers(socket as any)
})

async function startServer() {
  try {
    await testConnection()

    httpServer.listen(config.server.port, () => {
      console.log(`[Server] 服务已启动: http://${config.server.host}:${config.server.port}`)
      console.log(`[Server] CORS允许源: ${config.cors.origin}`)
      console.log(`[Server] Socket.io 已就绪（需 JWT 认证）`)
    })
  } catch (error) {
    console.error('[Server] 启动失败:', error)
    process.exit(1)
  }
}

startServer()

export { io, httpServer }
