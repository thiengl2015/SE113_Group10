const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const tokens = require("../utils/tokens");
const { sendVerificationOtp, sendPasswordResetOtp } = require("./emailService");

const BCRYPT_ROUNDS = 10;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const LOGIN_MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS, 10) || 5;
const LOGIN_LOCK_MINUTES = parseInt(process.env.LOGIN_LOCK_MINUTES, 10) || 30;
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES, 10) || 10;

const hashPassword = (raw) => bcrypt.hash(raw, BCRYPT_ROUNDS);
const verifyPassword = (raw, hash) => bcrypt.compare(raw, hash);
const generateOtp = () =>
  String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

const register = async ({ username, email, password }) => {
  const byEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, is_verified: true },
  });

  if (byEmail && byEmail.is_verified) {
    throw ApiError.conflict("Email already registered");
  }

  const byUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (byUsername && (!byEmail || byUsername.id !== byEmail.id)) {
    throw ApiError.conflict("Username already taken");
  }

  const hashed = await hashPassword(password);
  const otp = generateOtp();
  const otpExp = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  if (byEmail) {
    await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        username,
        password: hashed,
        full_name: username,
        verification_token: otp,
        verification_token_exp: otpExp,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        full_name: username,
        phone: "",
        role: "customer",
        status: "pending",
        is_verified: false,
        verification_token: otp,
        verification_token_exp: otpExp,
      },
    });
  }

  sendVerificationOtp(email, otp);

  return { email };
};

const verifyEmail = async (email, otp) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      is_verified: true,
      verification_token: true,
      verification_token_exp: true,
    },
  });
  if (!user) throw ApiError.badRequest("Invalid OTP");
  if (user.is_verified) throw ApiError.badRequest("Account already verified");
  if (!user.verification_token || user.verification_token !== otp) {
    throw ApiError.badRequest("Invalid OTP");
  }
  if (
    !user.verification_token_exp ||
    new Date(user.verification_token_exp) < new Date()
  ) {
    throw ApiError.badRequest("OTP expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      is_verified: true,
      status: "active",
      verification_token: null,
      verification_token_exp: null,
    },
  });
};

const issueTokens = async (user) => {
  const payload = { sub: user.id, role: user.role, username: user.username };
  const accessToken = tokens.signAccessToken(payload);
  const refreshToken = tokens.signRefreshToken(payload);

  const tokenHash = tokens.hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + tokens.parseDuration(JWT_REFRESH_EXPIRES_IN),
  );

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

const login = async ({ identifier, password }) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true,
      status: true,
      is_verified: true,
      failed_login_attempts: true,
      lock_until: true,
    },
  });
  if (!user) throw ApiError.unauthorized("Invalid credentials");

  if (user.lock_until && new Date(user.lock_until) > new Date()) {
    throw ApiError.forbidden("Account temporarily locked. Try again later.");
  }
  if (user.lock_until && new Date(user.lock_until) <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_login_attempts: 0, lock_until: null },
    });
    user.failed_login_attempts = 0;
    user.lock_until = null;
  }
  if (!user.is_verified) {
    throw ApiError.forbidden("Account not verified. Please check your email.");
  }
  if (user.status === "blocked") {
    throw ApiError.forbidden("Account has been blocked by administrator.");
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    const attempts = user.failed_login_attempts + 1;
    let lockUntil = null;
    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      lockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_login_attempts: attempts, lock_until: lockUntil },
    });
    throw ApiError.unauthorized("Invalid credentials");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failed_login_attempts: 0, lock_until: null },
  });

  const tokensPair = await issueTokens(user);
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    ...tokensPair,
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw ApiError.unauthorized("Missing refresh token");

  try {
    tokens.verifyRefreshToken(refreshToken);
  } catch (e) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const tokenHash = tokens.hashToken(refreshToken);
  const row = await prisma.refreshToken.findFirst({
    where: { token_hash: tokenHash },
    include: {
      user: { select: { username: true, role: true, status: true } },
    },
  });
  if (!row) throw ApiError.unauthorized("Refresh token not recognized");

  if (new Date(row.expires_at) < new Date())
    throw ApiError.unauthorized("Refresh token expired");
  if (row.user.status === "blocked")
    throw ApiError.forbidden("Account blocked");

  await prisma.refreshToken.delete({ where: { id: row.id } });

  const user = {
    id: row.user_id,
    username: row.user.username,
    role: row.user.role,
  };
  const newPair = await issueTokens(user);
  return newPair;
};

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = tokens.hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
};

const revokeAllForUser = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { user_id: userId } });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return;

  await prisma.passwordResetToken.updateMany({
    where: { user_id: user.id, used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  const tokenHash = tokens.hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.passwordResetToken.create({
    data: { user_id: user.id, token_hash: tokenHash, expires_at: expiresAt },
  });

  sendPasswordResetOtp(email, otp);
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) throw ApiError.badRequest("Invalid OTP");

  const tokenHash = tokens.hashToken(otp);
  const r = await prisma.passwordResetToken.findFirst({
    where: { user_id: user.id, token_hash: tokenHash },
    orderBy: { created_at: "desc" },
  });
  if (!r) throw ApiError.badRequest("Invalid OTP");
  if (r.used) throw ApiError.badRequest("OTP already used");
  if (new Date(r.expires_at) < new Date())
    throw ApiError.badRequest("OTP expired");

  const hashed = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    await tx.passwordResetToken.update({
      where: { id: r.id },
      data: { used: true },
    });
    await tx.refreshToken.deleteMany({ where: { user_id: user.id } });
  });
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) throw ApiError.notFound("User not found");

  const ok = await verifyPassword(currentPassword, user.password);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");

  if (await verifyPassword(newPassword, user.password)) {
    throw ApiError.badRequest("New password must differ from current password");
  }

  const hashed = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    await tx.refreshToken.deleteMany({ where: { user_id: userId } });
  });
};

const resendVerification = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, is_verified: true, status: true },
  });
  if (!user) return;
  if (user.is_verified) return;
  if (user.status === "blocked") return;

  const otp = generateOtp();
  const otpExp = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verification_token: otp,
      verification_token_exp: otpExp,
    },
  });

  sendVerificationOtp(email, otp);
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  revokeAllForUser,
  forgotPassword,
  resetPassword,
  changePassword,
  resendVerification,
};
