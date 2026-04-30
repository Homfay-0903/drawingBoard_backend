import express from 'express'
import cors from 'cors'
import { config } from './config'

const app = express()

app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  credentials: config.cors.credentials
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '你画我猜游戏服务运行中',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/rooms', (req, res) => {
  res.json({
    rooms: [],
    message: '房间列表接口，将通过Socket.io实时同步'
  })
})

export default app
