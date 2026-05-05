import type { PlayerData } from '../types'

export class Player {
  userId: number          // 数据库用户 ID（唯一标识）
  nickname: string
  avatar: string
  score: number
  isReady: boolean
  isDrawing: boolean
  hasGuessed: boolean
  socketId: string        // 当前 socket 连接 ID（可变）
  isHost: boolean
  joinedAt: Date

  constructor(userId: number, nickname: string, avatar: string, socketId: string, isHost: boolean = false) {
    this.userId = userId
    this.nickname = nickname
    this.avatar = avatar
    this.score = 0
    this.isReady = isHost
    this.isDrawing = false
    this.hasGuessed = false
    this.socketId = socketId
    this.isHost = isHost
    this.joinedAt = new Date()
  }

  // 用 userId 作为唯一标识（不再用 UUID）
  get id(): string {
    return `user_${this.userId}`
  }

  // 更新 socketId（重连时使用）
  updateSocketId(newSocketId: string): void {
    this.socketId = newSocketId
  }

  reset(): void {
    this.score = 0
    this.isReady = this.isHost
    this.isDrawing = false
    this.hasGuessed = false
  }

  toJSON(): PlayerData {
    return {
      id: this.id,
      userId: this.userId,
      nickname: this.nickname,
      avatar: this.avatar,
      score: this.score,
      isReady: this.isReady,
      isDrawing: this.isDrawing,
      hasGuessed: this.hasGuessed,
      socketId: this.socketId,
      isHost: this.isHost
    }
  }
}
