const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Register
const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc username đã tồn tại'
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    await db.query(
      `INSERT INTO users (username, email, password, fullName, role, isVerified, verificationToken, verificationTokenExp, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'user', FALSE, ?, ?, NOW(), NOW())`,
      [username, email, hashedPassword, fullName, verificationToken, verificationTokenExp]
    );

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await db.query(
      'SELECT id, username, email, password, fullName, role, isVerified, isActive FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const user = users[0];

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy token'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db.query('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const users = await db.query(
      'SELECT id, email, verificationTokenExp FROM users WHERE verificationToken = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const user = users[0];

    if (new Date(user.verificationTokenExp) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }

    await db.query(
      'UPDATE users SET isVerified = TRUE, verificationToken = NULL, verificationTokenExp = NULL WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const users = await db.query('SELECT id, email FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi.'
      });
    }

    const user = users[0];

    await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const tokens = await db.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    const tokenRecord = tokens[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, tokenRecord.user_id]);

    await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = ?', [token]);

    await db.query('DELETE FROM user_sessions WHERE user_id = ?', [tokenRecord.user_id]);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, email, fullName, role, avatar, phone, address, isActive, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { register, login, logout, verifyEmail, forgotPassword, resetPassword, getMe };