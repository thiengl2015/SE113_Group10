const authService = require("../services/authService");
const { ok } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const data = await authService.register({ username, email, password });
  return ok(res, {
    statusCode: 201,
    message: "Registration successful. Please check your email for OTP.",
    data: { email: data.email },
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  await authService.verifyEmail(email, otp);
  return ok(res, {
    message: "Email verified successfully. You can now sign in.",
  });
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login({ identifier, password });

  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  return ok(res, {
    message: "Login successful",
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(refreshToken);
  res.clearCookie(REFRESH_COOKIE);
  return ok(res, { message: "Signed out successfully." });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const result = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  return ok(res, {
    message: "Token refreshed",
    data: { accessToken: result.accessToken },
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return ok(res, {
    message: "If the email exists, an OTP has been sent.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  await authService.resetPassword(email, otp, password);
  return ok(res, { message: "Password reset successfully. Please sign in." });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.clearCookie(REFRESH_COOKIE);
  return ok(res, { message: "Password changed. Please sign in again." });
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);
  return ok(res, {
    message: "If the email exists and is unverified, a new OTP has been sent.",
  });
});

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  resendVerification,
};
