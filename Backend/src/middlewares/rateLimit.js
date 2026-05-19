const rateLimit = require("express-rate-limit");

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000;
const max = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Too many requests, please slow down.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Too many auth requests, please try again later.",
  },
});

module.exports = { apiLimiter, authLimiter };
