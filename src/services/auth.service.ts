import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../database'
import { config } from '../config'

export interface UserRow {
  id: number
  username: string
  password_hash: string
  nickname: string
  avatar: string
  total_score: number
  games_played: number
  games_won: number
}

export interface UserPublicData {
  id: number
  username: string
  nickname: string
  avatar: string
  totalScore: number
  gamesPlayed: number
  gamesWon: number
}

export class AuthService {
  // 注册
  async register(username: string, password: string, nickname: string): Promise<{ user: UserPublicData; token: string }> {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )
    if ((existing as any[]).length > 0) {
      throw new Error('用户名已存在')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const avatars = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷']
    const avatar = avatars[Math.floor(Math.random() * avatars.length)]

    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, nickname, avatar) VALUES (?, ?, ?, ?)',
      [username, passwordHash, nickname, avatar]
    )

    const userId = (result as any).insertId
    const token = this.generateToken(userId, username)
    const user = await this.getUserById(userId)

    return { user: this.toPublicData(user!), token }
  }

  // 登录
  async login(username: string, password: string): Promise<{ user: UserPublicData; token: string }> {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    const users = rows as UserRow[]

    if (users.length === 0) {
      throw new Error('用户名或密码错误')
    }

    const user = users[0]
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误')
    }

    const token = this.generateToken(user.id, user.username)
    return { user: this.toPublicData(user), token }
  }

  // 根据 ID 获取用户
  async getUserById(id: number): Promise<UserRow | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )
    const users = rows as UserRow[]
    return users.length > 0 ? users[0] : null
  }

  // 验证 JWT Token
  verifyToken(token: string): { userId: number; username: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any
      return { userId: decoded.userId, username: decoded.username }
    } catch {
      return null
    }
  }

  // 生成 JWT Token
  private generateToken(userId: number, username: string): string {
    return jwt.sign(
      { userId, username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    )
  }

  // 转换为公开数据（去除密码等敏感信息）
  toPublicData(user: UserRow): UserPublicData {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      totalScore: user.total_score,
      gamesPlayed: user.games_played,
      gamesWon: user.games_won
    }
  }

  // 更新用户游戏统计
  async updateGameStats(userId: number, score: number, isWinner: boolean): Promise<void> {
    await pool.execute(
      'UPDATE users SET total_score = total_score + ?, games_played = games_played + 1, games_won = games_won + ? WHERE id = ?',
      [score, isWinner ? 1 : 0, userId]
    )
  }
}

export const authService = new AuthService()
