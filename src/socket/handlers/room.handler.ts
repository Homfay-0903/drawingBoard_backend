import { Socket, Server } from 'socket.io'
import { roomService } from '../../services/room.service'
import { authService } from '../../services/auth.service'
import { Player } from '../../models/Player'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
} from '../../types'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

export class RoomHandler {
  private io: TypedServer

  constructor(io: TypedServer) {
    this.io = io
  }

  registerHandlers(socket: TypedSocket): void {
    socket.on('room:create', (data: { name: string; maxPlayers: number }) =>
      this.handleCreateRoom(socket, data))
    socket.on('room:join', (data: { roomId: string }) =>
      this.handleJoinRoom(socket, data))
    socket.on('room:leave', (data: { roomId: string }) =>
      this.handleLeaveRoom(socket, data))
    socket.on('room:ready', (data: { roomId: string }) =>
      this.handleReady(socket, data))
    socket.on('disconnect', () => this.handleDisconnect(socket))
  }

  private handleCreateRoom(
    socket: TypedSocket,
    data: { name: string; maxPlayers: number }
  ): void {
    const { userId, playerId, nickname, avatar } = socket.data

    const room = roomService.createRoom(data.name, playerId, data.maxPlayers)
    const player = new Player(userId, nickname, avatar, socket.id, true)

    room.addPlayer(player)
    roomService.setPlayerRoom(playerId, room.id)

    socket.join(room.id)
    socket.data.roomId = room.id

    console.log(`[Room] 房间创建: ${room.id} by ${nickname}`)

    socket.emit('room:created', { room: room.toJSON() })
    this.broadcastRoomsUpdate()
  }

  private handleJoinRoom(
    socket: TypedSocket,
    data: { roomId: string }
  ): void {
    const room = roomService.getRoom(data.roomId)

    if (!room) {
      socket.emit('room:error', { message: '房间不存在' })
      return
    }

    if (room.status !== 'waiting') {
      socket.emit('room:error', { message: '游戏已开始，无法加入' })
      return
    }

    if (room.isFull() && !room.hasPlayer(socket.data.playerId)) {
      socket.emit('room:error', { message: '房间已满' })
      return
    }

    const { userId, playerId, nickname, avatar } = socket.data
    const player = new Player(userId, nickname, avatar, socket.id, false)

    room.addPlayer(player)
    roomService.setPlayerRoom(playerId, room.id)

    socket.join(room.id)
    socket.data.roomId = room.id

    console.log(`[Room] 玩家加入: ${nickname} -> ${room.id}`)

    socket.emit('room:joined', { room: room.toJSON(), player: room.getPlayer(playerId)!.toJSON() })
    socket.to(room.id).emit('room:updated', { room: room.toJSON() })
    this.broadcastRoomsUpdate()
  }

  private handleLeaveRoom(
    socket: TypedSocket,
    data: { roomId: string }
  ): void {
    this.leaveRoom(socket, data.roomId)
  }

  private handleReady(
    socket: TypedSocket,
    data: { roomId: string }
  ): void {
    const room = roomService.getRoom(data.roomId)
    if (!room) return

    const player = room.getPlayer(socket.data.playerId)
    if (!player) return

    player.isReady = !player.isReady
    console.log(`[Room] 玩家准备状态: ${player.nickname} -> ${player.isReady}`)

    this.io.to(room.id).emit('room:updated', { room: room.toJSON() })
  }

  private handleDisconnect(socket: TypedSocket): void {
    const roomId = socket.data.roomId
    const playerId = socket.data.playerId

    if (roomId) {
      const room = roomService.getRoom(roomId)
      if (room) {
        // 标记玩家断开但先不移除，给一定重连时间
        const player = room.getPlayer(playerId)
        if (player) {
          console.log(`[Room] 玩家断开连接: ${player.nickname}，等待重连...`)
        }
      }
    }

    console.log(`[Socket] 客户端断开: ${socket.id}`)
  }

  private leaveRoom(socket: TypedSocket, roomId: string): void {
    const room = roomService.getRoom(roomId)
    if (!room) return

    const playerId = socket.data.playerId
    const player = room.removePlayer(playerId)

    if (!player) return

    roomService.removePlayerFromMap(playerId)
    socket.leave(roomId)
    socket.data.roomId = null

    console.log(`[Room] 玩家离开: ${player.nickname} <- ${roomId}`)

    if (room.isEmpty()) {
      roomService.deleteRoom(roomId)
      console.log(`[Room] 房间删除: ${roomId}`)
      this.broadcastRoomsUpdate()
      return
    }

    if (player.isHost) {
      const newHost = room.getAllPlayers()[0]
      if (newHost) {
        room.transferHost(newHost.id)
        console.log(`[Room] 房主转移: ${newHost.nickname}`)
      }
    }

    this.io.to(room.id).emit('room:updated', { room: room.toJSON() })
    this.broadcastRoomsUpdate()
  }

  private broadcastRoomsUpdate(): void {
    const rooms = roomService.getRoomsData()
    this.io.emit('room:list', rooms)
  }
}
