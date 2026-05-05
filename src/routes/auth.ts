import { Router, Request, Response } from 'express'
import { authService } from '../services/auth.service'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, nickname } = req.body

    if (!username || !password || !nickname) {
      res.status(400).json({ message: '用户名、密码和昵称不能为空' })
      return
    }

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ message: '用户名长度需在3-20之间' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ message: '密码长度至少6位' })
      return
    }

    const result = await authService.register(username, password, nickname)
    res.status(201).json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
})

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码不能为空' })
      return
    }

    const result = await authService.login(username, password)
    res.json(result)
  } catch (error: any) {
    res.status(401).json({ message: error.message })
  }
})

// 获取当前用户信息（需认证）
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.userId)
    if (!user) {
      res.status(404).json({ message: '用户不存在' })
      return
    }
    res.json({ user: authService.toPublicData(user) })
  } catch (error: any) {
    res.status(500).json({ message: '服务器错误' })
  }
})

export default router
