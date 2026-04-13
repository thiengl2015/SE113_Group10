const express = require('express');
const { register, login, logout, verifyEmail, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);

router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

module.exports = router;