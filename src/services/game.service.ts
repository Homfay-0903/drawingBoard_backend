import { Server } from 'socket.io'
import { Room } from '../models/Room'
import { Game } from '../models/Game'
import { roomService } from './room.service'
import { wordService } from './word.service'
import type { DrawingElement, GameStateData, ServerToClientEvents, SocketData } from '../types'

type TypedServer = Server<ServerToClientEvents, any, any, SocketData>

export class GameService {
  private games: Map<string, Game>
  private io: TypedServer

  constructor(io: TypedServer) {
    this.games = new Map()
    this.io = io
  }

  getGame(roomId: string): Game | undefined {
    return this.games.get(roomId)
  }

  createGame(roomId: string, maxRounds: number, drawTime: number): Game {
    const game = new Game(roomId, maxRounds, drawTime)
    this.games.set(roomId, game)
    return game
  }

  deleteGame(roomId: string): void {
    const game = this.games.get(roomId)
    if (game) {
      game.stopTimer()
      this.games.delete(roomId)
    }
  }

  startGame(room: Room): boolean {
    if (room.status !== 'waiting') return false

    const game = this.createGame(room.id, room.maxRounds, room.drawTime)
    room.status = 'playing'
    
    const playerIds = room.getAllPlayers().map(p => p.id)
    game.startNewRound(playerIds)

    const drawerId = game.getCurrentDrawerId()
    if (drawerId) {
      room.currentDrawerId = drawerId
      const drawer = room.getPlayer(drawerId)
      if (drawer) drawer.isDrawing = true
    }

    this.broadcastGameState(room, game)

    const words = wordService.getRandomWords(3)
    const drawer = room.getPlayer(drawerId!)
    if (drawer) {
      this.io.to(drawer.socketId).emit('game:selectWord', { words })
    }

    this.startSelectingTimer(room, game)

    return true
  }

  private startSelectingTimer(room: Room, game: Game): void {
    game.timeLeft = game.selectTime
    game.status = 'selecting'

    game.timer = setInterval(() => {
      game.timeLeft--
      this.io.to(room.id).emit('game:tick', { timeLeft: game.timeLeft })

      if (game.timeLeft <= 0) {
        game.stopTimer()
        const words = wordService.getRandomWords(1)
        if (words.length > 0) {
          this.selectWord(room, game, words[0])
        }
      }
    }, 1000)
  }

  selectWord(room: Room, game: Game, word: string): void {
    game.stopTimer()
    
    const hints = wordService.generateHints(word)
    game.setWord(word, hints)
    
    room.currentWord = word
    room.wordHints = hints

    this.io.to(room.id).emit('game:wordHint', {
      hints,
      length: word.length
    })

    const drawer = room.getPlayer(game.getCurrentDrawerId()!)
    if (drawer) {
      this.io.to(drawer.socketId).emit('game:selectWord', { words: [word] })
    }

    this.startDrawingTimer(room, game)
  }

  private startDrawingTimer(room: Room, game: Game): void {
    game.timeLeft = game.drawTime
    game.status = 'drawing'

    game.timer = setInterval(() => {
      game.timeLeft--
      this.io.to(room.id).emit('game:tick', { timeLeft: game.timeLeft })

      if (game.timeLeft <= 0) {
        this.endRound(room, game)
      }
    }, 1000)
  }

  guessWord(room: Room, game: Game, playerId: string, guess: string): boolean {
    if (game.status !== 'drawing') return false
    if (!game.currentWord) return false
    if (game.hasGuessed(playerId)) return false

    const player = room.getPlayer(playerId)
    if (!player || player.isDrawing) return false

    const normalizedGuess = guess.toLowerCase().replace(/\s/g, '')
    const normalizedWord = game.currentWord.toLowerCase().replace(/\s/g, '')

    if (normalizedGuess === normalizedWord) {
      game.addCorrectGuesser(playerId)
      
      const guesserCount = game.correctGuessers.size
      const score = this.calculateGuesserScore(game.timeLeft, guesserCount)
      game.addRoundScore(playerId, score)
      player.score += score

      const drawer = room.getPlayer(game.getCurrentDrawerId()!)
      if (drawer) {
        const drawerScore = this.calculateDrawerScore(game.correctGuessers.size, room.players.size)
        game.addRoundScore(drawer.id, drawerScore)
        drawer.score += drawerScore
      }

      this.io.to(room.id).emit('game:correctGuess', {
        playerId,
        playerName: player.nickname,
        score
      })

      this.io.to(room.id).emit('room:updated', { room: room.toJSON() })

      if (game.allPlayersGuessed(room.players.size)) {
        this.endRound(room, game)
      }

      return true
    }

    return false
  }

  private calculateGuesserScore(timeLeft: number, guesserCount: number): number {
    const baseScore = 100
    const timeBonus = Math.floor(timeLeft * 2)
    const orderBonus = Math.max(0, 50 - guesserCount * 10)
    return baseScore + timeBonus + orderBonus
  }

  private calculateDrawerScore(correctCount: number, totalPlayers: number): number {
    const ratio = correctCount / Math.max(1, totalPlayers - 1)
    return Math.floor(50 * ratio * correctCount)
  }

  private endRound(room: Room, game: Game): void {
    game.stopTimer()
    game.endRound()

    const scores = game.getRoundScores()
    this.io.to(room.id).emit('game:roundEnd', {
      word: game.currentWord || '',
      scores
    })

    setTimeout(() => {
      if (game.isLastRound()) {
        this.endGame(room, game)
      } else {
        this.startNextRound(room, game)
      }
    }, 5000)
  }

  private startNextRound(room: Room, game: Game): void {
    const playerIds = room.getAllPlayers().map(p => p.id)
    
    const currentDrawer = room.getPlayer(game.getCurrentDrawerId()!)
    if (currentDrawer) {
      currentDrawer.isDrawing = false
    }

    game.startNewRound(playerIds)

    const drawerId = game.getCurrentDrawerId()
    if (drawerId) {
      room.currentDrawerId = drawerId
      const drawer = room.getPlayer(drawerId)
      if (drawer) {
        drawer.isDrawing = true
      }
    }

    this.broadcastGameState(room, game)

    const words = wordService.getRandomWords(3)
    const drawer = room.getPlayer(drawerId!)
    if (drawer) {
      this.io.to(drawer.socketId).emit('game:selectWord', { words })
    }

    this.startSelectingTimer(room, game)
  }

  private endGame(room: Room, game: Game): void {
    game.endGame()
    room.status = 'finished'

    const finalScores: Record<string, number> = {}
    room.getAllPlayers().forEach(player => {
      finalScores[player.id] = player.score
    })

    this.io.to(room.id).emit('game:gameEnd', { finalScores })
    this.io.to(room.id).emit('room:updated', { room: room.toJSON() })

    this.deleteGame(room.id)
  }

  addCanvasElement(room: Room, game: Game, element: DrawingElement): void {
    game.addCanvasElement(element)
    room.currentDrawerId = game.getCurrentDrawerId()
    
    const drawerId = game.getCurrentDrawerId()
    if (drawerId) {
      const drawer = room.getPlayer(drawerId)
      if (drawer) {
        this.io.to(room.id).except(drawer.socketId).emit('canvas:sync', { element })
      }
    }
  }

  clearCanvas(room: Room, game: Game): void {
    game.clearCanvas()
    this.io.to(room.id).emit('canvas:cleared')
  }

  private broadcastGameState(room: Room, game: Game): void {
    const gameState: GameStateData = {
      roomId: room.id,
      status: game.status,
      currentWord: game.currentWord,
      wordHints: game.wordHints,
      timeLeft: game.timeLeft,
      drawerId: game.getCurrentDrawerId() || '',
      correctGuessers: Array.from(game.correctGuessers),
      canvasData: game.canvasData
    }
    this.io.to(room.id).emit('game:started', { gameState })
  }

  resetGame(room: Room): void {
    const game = this.games.get(room.id)
    if (game) {
      game.reset()
      this.deleteGame(room.id)
    }
    
    room.status = 'waiting'
    room.currentRound = 0
    room.currentDrawerId = null
    room.currentWord = null
    room.wordHints = []
    
    room.getAllPlayers().forEach(player => {
      player.isDrawing = false
      player.hasGuessed = false
    })
    
    this.io.to(room.id).emit('room:updated', { room: room.toJSON() })
  }
}

export const createGameService = (io: TypedServer): GameService => {
  return new GameService(io)
}
