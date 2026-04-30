import type { DrawingElement, GameStatus, PlayerData } from '../types'

export class Game {
  roomId: string
  status: GameStatus
  currentRound: number
  maxRounds: number
  drawerIndex: number
  drawerOrder: string[]
  currentWord: string | null
  wordHints: string[]
  timeLeft: number
  drawTime: number
  selectTime: number
  correctGuessers: Set<string>
  canvasData: DrawingElement[]
  timer: NodeJS.Timeout | null
  roundScores: Map<string, number>

  constructor(roomId: string, maxRounds: number = 3, drawTime: number = 60) {
    this.roomId = roomId
    this.status = 'waiting'
    this.currentRound = 0
    this.maxRounds = maxRounds
    this.drawerIndex = 0
    this.drawerOrder = []
    this.currentWord = null
    this.wordHints = []
    this.timeLeft = drawTime
    this.drawTime = drawTime
    this.selectTime = 10
    this.correctGuessers = new Set()
    this.canvasData = []
    this.timer = null
    this.roundScores = new Map()
  }

  startNewRound(playerIds: string[]): void {
    this.currentRound++
    this.drawerIndex = (this.currentRound - 1) % playerIds.length
    this.drawerOrder = playerIds
    this.currentWord = null
    this.wordHints = []
    this.correctGuessers.clear()
    this.canvasData = []
    this.roundScores.clear()
    this.status = 'selecting'
  }

  setWord(word: string, hints: string[]): void {
    this.currentWord = word
    this.wordHints = hints
    this.status = 'drawing'
    this.timeLeft = this.drawTime
  }

  getCurrentDrawerId(): string | null {
    if (this.drawerOrder.length === 0) return null
    return this.drawerOrder[this.drawerIndex]
  }

  addCorrectGuesser(playerId: string): boolean {
    if (this.correctGuessers.has(playerId)) return false
    this.correctGuessers.add(playerId)
    return true
  }

  hasGuessed(playerId: string): boolean {
    return this.correctGuessers.has(playerId)
  }

  allPlayersGuessed(totalPlayers: number): boolean {
    return this.correctGuessers.size >= totalPlayers - 1
  }

  addCanvasElement(element: DrawingElement): void {
    this.canvasData.push(element)
  }

  clearCanvas(): void {
    this.canvasData = []
  }

  addRoundScore(playerId: string, score: number): void {
    const current = this.roundScores.get(playerId) || 0
    this.roundScores.set(playerId, current + score)
  }

  getRoundScores(): Record<string, number> {
    const result: Record<string, number> = {}
    this.roundScores.forEach((score, playerId) => {
      result[playerId] = score
    })
    return result
  }

  isLastRound(): boolean {
    return this.currentRound >= this.maxRounds
  }

  endRound(): void {
    this.status = 'roundEnd'
    this.stopTimer()
  }

  endGame(): void {
    this.status = 'gameEnd'
    this.stopTimer()
  }

  stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  reset(): void {
    this.status = 'waiting'
    this.currentRound = 0
    this.drawerIndex = 0
    this.drawerOrder = []
    this.currentWord = null
    this.wordHints = []
    this.correctGuessers.clear()
    this.canvasData = []
    this.roundScores.clear()
    this.stopTimer()
  }
}
