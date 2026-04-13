const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sessions = await db.query(
      'SELECT user_id FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid'
      });
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = auth;