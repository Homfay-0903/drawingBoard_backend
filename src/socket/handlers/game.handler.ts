import { Socket, Server } from 'socket.io'
import { roomService } from '../../services/room.service'
import { GameService } from '../../services/game.service'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
} from '../../types'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

export class GameHandler {
  private io: TypedServer
  private gameService: GameService

  constructor(io: TypedServer, gameService: GameService) {
    this.io = io
    this.gameService = gameService
  }

  registerHandlers(socket: TypedSocket): void {
    socket.on('game:start', (data: { roomId: string }) => this.handleStartGame(socket, data))
    socket.on('game:selectWord', (data: { roomId: string; word: string }) => this.handleSelectWord(socket, data))
    socket.on('chat:message', (data: { roomId: string; message: string }) => this.handleChatMessage(socket, data))
  }

  private handleStartGame(socket: TypedSocket, data: { roomId: string }): void {
    const room = roomService.getRoom(data.roomId)
    if (!room) {
      socket.emit('room:error', { message: '房间不存在' })
      return
    }

    const player = room.getPlayer(socket.data.playerId)
    if (!player || !player.isHost) {
      socket.emit('room:error', { message: '只有房主才能开始游戏' })
      return
    }

    if (!room.canStartGame()) {
      socket.emit('room:error', { message: '玩家未全部准备' })
      return
    }

    console.log(`[Game] 游戏开始: ${room.id}`)
    this.gameService.startGame(room)
  }

  private handleSelectWord(socket: TypedSocket, data: { roomId: string; word: string }): void {
    const room = roomService.getRoom(data.roomId)
    if (!room) return

    const game = this.gameService.getGame(data.roomId)
    if (!game) return

    const drawerId = game.getCurrentDrawerId()
    if (socket.data.playerId !== drawerId) return

    console.log(`[Game] 选择词语: ${data.word}`)
    this.gameService.selectWord(room, game, data.word)
  }

  private handleChatMessage(socket: TypedSocket, data: { roomId: string; message: string }): void {
    const room = roomService.getRoom(data.roomId)
    if (!room) return

    const player = room.getPlayer(socket.data.playerId)
    if (!player) return

    const game = this.gameService.getGame(data.roomId)
    
    if (game && game.status === 'drawing' && !player.isDrawing) {
      const isCorrect = this.gameService.guessWord(room, game, player.id, data.message)
      
      if (isCorrect) {
        this.io.to(room.id).emit('chat:message', {
          playerId: player.id,
          playerName: player.nickname,
          message: '猜对了！',
          type: 'correct'
        })
        return
      }
    }

    this.io.to(room.id).emit('chat:message', {
      playerId: player.id,
      playerName: player.nickname,
      message: data.message,
      type: 'chat'
    })
  }
}
