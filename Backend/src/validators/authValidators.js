const { body } = require("express-validator");

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const PASSWORD_MSG =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
const OTP_REGEX = /^\d{6}$/;
const OTP_MSG = "OTP must be a 6-digit number";

const registerRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, underscores"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_MSG),
];

const loginRules = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const verifyEmailRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("otp").trim().matches(OTP_REGEX).withMessage(OTP_MSG),
];

const forgotPasswordRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

const resetPasswordRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("otp").trim().matches(OTP_REGEX).withMessage(OTP_MSG),
  body("password").matches(PASSWORD_REGEX).withMessage(PASSWORD_MSG),
];

const changePasswordRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword").matches(PASSWORD_REGEX).withMessage(PASSWORD_MSG),
];

module.exports = {
  registerRules,
  loginRules,
  verifyEmailRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
};
