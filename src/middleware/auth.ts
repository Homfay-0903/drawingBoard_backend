import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'

// 扩展 Express Request 类型，添加 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number
        username: string
      }
    }
  }
}

// JWT 认证中间件
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '未提供认证令牌' })
    return
  }

  const token = authHeader.split(' ')[1]
  const payload = authService.verifyToken(token)

  if (!payload) {
    res.status(401).json({ message: '认证令牌无效或已过期' })
    return
  }

  req.user = payload
  next()
}
