import express from 'express'
import cors from 'cors'
import { config } from './config'
import authRoutes from './routes/auth'

const app = express()

app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  credentials: config.cors.credentials
}))

app.use(express.json())

// API 路由
app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '你画我猜游戏服务运行中',
    timestamp: new Date().toISOString()
  })
})

export default app
