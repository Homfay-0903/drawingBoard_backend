import { Socket, Server } from 'socket.io'
import { roomService } from '../../services/room.service'
import { GameService } from '../../services/game.service'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  DrawingElement
} from '../../types'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

export class CanvasHandler {
  private io: TypedServer
  private gameService: GameService

  constructor(io: TypedServer, gameService: GameService) {
    this.io = io
    this.gameService = gameService
  }

  registerHandlers(socket: TypedSocket): void {
    socket.on('canvas:draw', (data: { roomId: string; element: DrawingElement }) => this.handleDraw(socket, data))
    socket.on('canvas:clear', (data: { roomId: string }) => this.handleClear(socket, data))
  }

  private handleDraw(socket: TypedSocket, data: { roomId: string; element: DrawingElement }): void {
    const room = roomService.getRoom(data.roomId)
    if (!room) return

    const game = this.gameService.getGame(data.roomId)
    if (!game || game.status !== 'drawing') return

    const drawerId = game.getCurrentDrawerId()
    if (socket.data.playerId !== drawerId) return

    this.gameService.addCanvasElement(room, game, data.element)
  }

  private handleClear(socket: TypedSocket, data: { roomId: string }): void {
    const room = roomService.getRoom(data.roomId)
    if (!room) return

    const game = this.gameService.getGame(data.roomId)
    if (!game) return

    const drawerId = game.getCurrentDrawerId()
    if (socket.data.playerId !== drawerId) return

    this.gameService.clearCanvas(room, game)
  }
}
