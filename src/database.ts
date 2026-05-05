import mysql from 'mysql2/promise'
import { config } from './config'

export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('[Database] MySQL 连接成功')
  } catch (error) {
    console.error('[Database] MySQL 连接失败:', error)
    throw error
  }
}
