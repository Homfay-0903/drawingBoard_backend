import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app'
import { config } from './config'
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

const gameService = createGameService(io as any)
const roomHandler = new RoomHandler(io as any)
const gameHandler = new GameHandler(io as any, gameService)
const canvasHandler = new CanvasHandler(io as any, gameService)

io.on('connection', (socket) => {
  console.log(`[Socket] 客户端连接: ${socket.id}`)

  socket.data.playerId = socket.id
  socket.data.roomId = null
  socket.data.nickname = ''

  roomHandler.registerHandlers(socket as any)
  gameHandler.registerHandlers(socket as any)
  canvasHandler.registerHandlers(socket as any)
})

httpServer.listen(config.server.port, () => {
  console.log(`[Server] 服务已启动: http://${config.server.host}:${config.server.port}`)
  console.log(`[Server] CORS允许源: ${config.cors.origin}`)
  console.log(`[Server] Socket.io 已就绪`)
})

export { io, httpServer }
