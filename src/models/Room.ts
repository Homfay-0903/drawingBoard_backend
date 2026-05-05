import { v4 as uuidv4 } from 'uuid'
import { Player } from './Player'
import type { RoomData, RoomStatus } from '../types'

export class Room {
  id: string
  name: string
  hostId: string              // 房主的 player.id（即 user_{userId}）
  players: Map<string, Player>  // key 为 player.id
  maxPlayers: number
  status: RoomStatus
  currentRound: number
  maxRounds: number
  currentDrawerId: string | null
  currentWord: string | null
  wordHints: string[]
  drawTime: number
  createdAt: Date

  constructor(name: string, hostId: string, maxPlayers: number = 6) {
    this.id = uuidv4()
    this.name = name
    this.hostId = hostId
    this.players = new Map()
    this.maxPlayers = maxPlayers
    this.status = 'waiting'
    this.currentRound = 0
    this.maxRounds = 3
    this.currentDrawerId = null
    this.currentWord = null
    this.wordHints = []
    this.drawTime = 60
    this.createdAt = new Date()
  }

  addPlayer(player: Player): boolean {
    if (this.isFull()) return false
    // 如果玩家已在房间中（重连），更新 socketId
    if (this.players.has(player.id)) {
      const existing = this.players.get(player.id)!
      existing.updateSocketId(player.socketId)
      return true
    }
    this.players.set(player.id, player)
    return true
  }

  removePlayer(playerId: string): Player | undefined {
    const player = this.players.get(playerId)
    if (player) {
      this.players.delete(playerId)
    }
    return player
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId)
  }

  // 通过数据库 userId 查找玩家
  getPlayerByUserId(userId: number): Player | undefined {
    return this.players.get(`user_${userId}`)
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) return player
    }
    return undefined
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values())
  }

  isFull(): boolean {
    return this.players.size >= this.maxPlayers
  }

  isEmpty(): boolean {
    return this.players.size === 0
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId)
  }

  transferHost(newHostId: string): boolean {
    const oldHost = this.getPlayer(this.hostId)
    const newHost = this.getPlayer(newHostId)

    if (!newHost) return false

    if (oldHost) {
      oldHost.isHost = false
      oldHost.isReady = oldHost.isReady
    }

    this.hostId = newHostId
    newHost.isHost = true
    newHost.isReady = true
    return true
  }

  allPlayersReady(): boolean {
    for (const player of this.players.values()) {
      if (!player.isReady) return false
    }
    return true
  }

  canStartGame(): boolean {
    return this.players.size >= 2 && this.allPlayersReady()
  }

  toJSON(): RoomData {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      players: this.getAllPlayers().map(p => p.toJSON()),
      maxPlayers: this.maxPlayers,
      status: this.status,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      currentDrawerId: this.currentDrawerId,
      currentWord: this.currentWord,
      wordHints: this.wordHints,
      drawTime: this.drawTime,
      canStartGame: this.canStartGame()
    }
  }
}
