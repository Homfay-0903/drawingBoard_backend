export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost'
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },

  game: {
    defaultMaxPlayers: 6,
    defaultMaxRounds: 3,
    defaultDrawTime: 60,
    selectWordTime: 10,
    roundEndTime: 5
  },

  word: {
    selectCount: 3,
    minWordLength: 2,
    maxWordLength: 4
  }
}
