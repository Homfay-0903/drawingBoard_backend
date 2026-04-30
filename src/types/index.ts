export interface DrawingElement {
  id: string
  type: 'rectangle' | 'line' | 'text'
  x: number
  y: number
  width: number
  height: number
  stroke: string
  strokeWidth: number
  roughness?: number
  lineShape?: 'arrow' | 'hand'
  points?: { x: number; y: number }[]
  content?: string
}

export interface PlayerData {
  id: string
  nickname: string
  avatar: string
  score: number
  isReady: boolean
  isDrawing: boolean
  hasGuessed: boolean
  socketId: string
  isHost: boolean
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface RoomData {
  id: string
  name: string
  hostId: string
  players: PlayerData[]
  maxPlayers: number
  status: RoomStatus
  currentRound: number
  maxRounds: number
  currentDrawerId: string | null
  currentWord: string | null
  wordHints: string[]
  drawTime: number
}

export type GameStatus = 'waiting' | 'selecting' | 'drawing' | 'roundEnd' | 'gameEnd'

export interface GameStateData {
  roomId: string
  status: GameStatus
  currentWord: string | null
  wordHints: string[]
  timeLeft: number
  drawerId: string
  correctGuessers: string[]
  canvasData: DrawingElement[]
}

export interface ChatMessageData {
  id: string
  playerId: string
  playerName: string
  content: string
  type: 'chat' | 'system' | 'correct'
  timestamp: number
}

export interface ServerToClientEvents {
  'room:list': (data: RoomData[]) => void
  'room:created': (data: { room: RoomData }) => void
  'room:joined': (data: { room: RoomData; player: PlayerData }) => void
  'room:updated': (data: { room: RoomData }) => void
  'room:error': (data: { message: string }) => void
  'game:started': (data: { gameState: GameStateData }) => void
  'game:selectWord': (data: { words: string[] }) => void
  'game:wordHint': (data: { hints: string[]; length: number }) => void
  'game:tick': (data: { timeLeft: number }) => void
  'game:correctGuess': (data: { playerId: string; playerName: string; score: number }) => void
  'game:roundEnd': (data: { word: string; scores: Record<string, number> }) => void
  'game:gameEnd': (data: { finalScores: Record<string, number> }) => void
  'canvas:sync': (data: { element: DrawingElement }) => void
  'canvas:cleared': () => void
  'chat:message': (data: { playerId: string; playerName: string; message: string; type: 'chat' | 'system' | 'correct' }) => void
}

export interface ClientToServerEvents {
  'room:create': (data: { name: string; maxPlayers: number }) => void
  'room:join': (data: { roomId: string; nickname: string }) => void
  'room:leave': (data: { roomId: string }) => void
  'room:ready': (data: { roomId: string }) => void
  'game:start': (data: { roomId: string }) => void
  'game:selectWord': (data: { roomId: string; word: string }) => void
  'canvas:draw': (data: { roomId: string; element: DrawingElement }) => void
  'canvas:clear': (data: { roomId: string }) => void
  'chat:message': (data: { roomId: string; message: string }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  playerId: string
  roomId: string | null
  nickname: string
}
