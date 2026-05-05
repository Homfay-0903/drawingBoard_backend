-- 你画我猜游戏数据库建表语句
-- 请在 MySQL 中执行此脚本创建数据库和表

CREATE DATABASE IF NOT EXISTS drawing_game
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE drawing_game;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  avatar VARCHAR(10) DEFAULT '🐱',
  total_score INT DEFAULT 0,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 游戏记录表
CREATE TABLE IF NOT EXISTS game_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_name VARCHAR(100) NOT NULL,
  player_count INT NOT NULL,
  rounds INT NOT NULL,
  draw_time INT NOT NULL DEFAULT 60,
  duration INT DEFAULT 0,
  status ENUM('playing', 'finished') DEFAULT 'playing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 游戏详情表（每局每位玩家的记录）
CREATE TABLE IF NOT EXISTS game_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_id INT NOT NULL,
  user_id INT NOT NULL,
  score INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  correct_guesses INT DEFAULT 0,
  draw_count INT DEFAULT 0,
  FOREIGN KEY (game_id) REFERENCES game_records(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户（密码均为 123456 的 bcrypt hash）
INSERT INTO users (username, password_hash, nickname, avatar) VALUES
('player1', '$2b$10$emEhHKPRZewRgtiy7o4nw.shI0898buMuSHIQ6QFUd.JyY565nSoq', '玩家一', '🐱'),
('player2', '$2b$10$emEhHKPRZewRgtiy7o4nw.shI0898buMuSHIQ6QFUd.JyY565nSoq', '玩家二', '🐶'),
('player3', '$2b$10$emEhHKPRZewRgtiy7o4nw.shI0898buMuSHIQ6QFUd.JyY565nSoq', '玩家三', '🐰');
