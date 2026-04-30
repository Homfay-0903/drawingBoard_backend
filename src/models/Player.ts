import { v4 as uuidv4 } from 'uuid'
import type { PlayerData } from '../types'

export class Player {
  id: string
  nickname: string
  avatar: string
  score: number
  isReady: boolean
  isDrawing: boolean
  hasGuessed: boolean
  socketId: string
  isHost: boolean
  joinedAt: Date

  constructor(nickname: string, socketId: string, isHost: boolean = false) {
    this.id = uuidv4()
    this.nickname = nickname
    this.avatar = this.generateAvatar()
    this.score = 0
    this.isReady = isHost
    this.isDrawing = false
    this.hasGuessed = false
    this.socketId = socketId
    this.isHost = isHost
    this.joinedAt = new Date()
  }

  private generateAvatar(): string {
    const avatars = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷']
    return avatars[Math.floor(Math.random() * avatars.length)]
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
