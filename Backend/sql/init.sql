-- Create database if not exists
CREATE DATABASE IF NOT EXISTS se113_group10;
USE se113_group10;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  fullName VARCHAR(100) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  avatar VARCHAR(255) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  address VARCHAR(255) DEFAULT '',
  isActive BOOLEAN DEFAULT TRUE,
  isVerified BOOLEAN DEFAULT FALSE,
  verificationToken VARCHAR(64) DEFAULT NULL,
  verificationTokenExp DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_sessions table for logout tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  device_info VARCHAR(255) DEFAULT '',
  ip_address VARCHAR(45) DEFAULT '',
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);