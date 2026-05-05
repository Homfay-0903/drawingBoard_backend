import mysql from 'mysql2/promise'
import { config } from '../config'

export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection()
    console.log('[DB] MySQL 连接成功')
    conn.release()
  } catch (error) {
    console.error('[DB] MySQL 连接失败:', error)
    throw error
  }
}
