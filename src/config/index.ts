import dotenv from 'dotenv'
dotenv.config()

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'drawing_game'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
