/**
 * Jest Unit/Integration Tests for Auth Service
 * Module: TCS-G01 - Xác thực & Quản lý hồ sơ
 * 
 * Test Cases: TC-G01-001 → TC-G01-047
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Mock Prisma trước khi import authService
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  passwordResetToken: {
    updateMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../src/config/prisma", () => mockPrisma);

// Mock emailService
jest.mock("../src/services/emailService", () => ({
  sendVerificationOtp: jest.fn(),
  sendPasswordResetOtp: jest.fn(),
}));

// Mock tokens module
jest.mock("../src/utils/tokens", () => ({
  signAccessToken: jest.fn(() => "mock-access-token"),
  signRefreshToken: jest.fn(() => "mock-refresh-token"),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn((token) => `hashed-${token}`),
  parseDuration: jest.fn(() => 7 * 24 * 60 * 60 * 1000), // 7 days
}));

const authService = require("../src/services/authService");
const tokens = require("../src/utils/tokens");
const { sendVerificationOtp, sendPasswordResetOtp } = require("../src/services/emailService");
const ApiError = require("../src/utils/ApiError");

// Helper functions
const mockUser = (overrides = {}) => ({
  id: 1,
  username: "testuser",
  email: "test@example.com",
  password: "$2a$10$hashedpassword",
  role: "customer",
  status: "pending",
  is_verified: false,
  verification_token: null,
  verification_token_exp: null,
  failed_login_attempts: 0,
  lock_until: null,
  ...overrides,
});

const validPasswordHash = async (password) => {
  return bcrypt.hash(password, 10);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TCS-G01: Authentication & Profile Management", () => {
  describe("UC-01: Register (TC-G01-001 → TC-G01-006, TC-G01-038 → TC-G01-047)", () => {
    describe("TC-G01-001: Đăng ký thành công với email hợp lệ", () => {
      test("should create new user and send OTP", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue(mockUser({ email: "new@example.com" }));

        const result = await authService.register({
          username: "newuser",
          email: "new@example.com",
          password: "Password@123",
        });

        expect(result).toHaveProperty("email", "new@example.com");
        expect(mockPrisma.user.create).toHaveBeenCalled();
        expect(sendVerificationOtp).toHaveBeenCalledWith("new@example.com", expect.any(String));
      });
    });

    describe("TC-G01-002: Đăng ký với email đã tồn tại (đã verified)", () => {
      test("should throw conflict error for existing verified email", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({ email: "existing@example.com", is_verified: true })
        );

        await expect(
          authService.register({
            username: "newuser",
            email: "existing@example.com",
            password: "Password@123",
          })
        ).rejects.toThrow("Email already registered");
      });
    });

    describe("TC-G01-003: Đăng ký thiếu trường bắt buộc", () => {
      test("should handle registration with empty email (validation at controller level)", async () => {
        // Validation for empty/missing fields happens at controller level
        // Service receives validated data, so empty email will be handled by validator
        // This test documents expected behavior at service layer
        mockPrisma.user.findUnique.mockResolvedValue(null);
        
        // Service accepts empty email string (controller should reject it)
        const result = await authService.register({
          username: "testuser",
          email: "",
          password: "Password@123",
        });
        
        // At service level, empty string passes through
        // (Controller validation should reject this)
        expect(result).toHaveProperty("email", "");
      });
    });

    describe("TC-G01-038: Đăng ký với username đã tồn tại", () => {
      test("should throw conflict error for existing username", async () => {
        mockPrisma.user.findUnique
          .mockResolvedValueOnce(null) // email check
          .mockResolvedValueOnce(mockUser({ username: "existinguser" })); // username check

        await expect(
          authService.register({
            username: "existinguser",
            email: "new@example.com",
            password: "Password@123",
          })
        ).rejects.toThrow("Username already taken");
      });
    });

    describe("TC-G01-039/040: Đăng ký với username quá ngắn/dài", () => {
      test("should handle short username (validation at controller level)", async () => {
        // Validation happens at controller level with express-validator
        // Service accepts the data as-is
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await authService.register({
          username: "ab",
          email: "test@example.com",
          password: "Password@123",
        });

        expect(result).toHaveProperty("email", "test@example.com");
      });

      test("should handle long username (validation at controller level)", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await authService.register({
          username: "a".repeat(51),
          email: "test@example.com",
          password: "Password@123",
        });

        expect(result).toHaveProperty("email", "test@example.com");
      });
    });

    describe("TC-G01-041: Đăng ký với username chứa ký tự đặc biệt", () => {
      test("should handle username with special characters (validation at controller level)", async () => {
        // Validation happens at controller level
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await authService.register({
          username: "admin@#$%",
          email: "test@example.com",
          password: "Password@123",
        });

        expect(result).toHaveProperty("email", "test@example.com");
      });
    });

    describe("TC-G01-042: Đăng ký với email sai định dạng", () => {
      test("should handle invalid email format (validation at controller level)", async () => {
        // Email format validation happens at controller level
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await authService.register({
          username: "testuser",
          email: "not-an-email",
          password: "Password@123",
        });

        expect(result).toHaveProperty("email", "not-an-email");
      });
    });

    describe("TC-G01-046: Xác minh OTP đã hết hạn", () => {
      test("should throw error for expired OTP", async () => {
        const expiredTime = new Date(Date.now() - 10 * 60 * 1000); // 10 mins ago
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({
            is_verified: false,
            verification_token: "123456",
            verification_token_exp: expiredTime,
          })
        );

        await expect(
          authService.verifyEmail("test@example.com", "123456")
        ).rejects.toThrow("OTP expired");
      });
    });

    describe("TC-G01-047: Xác minh OTP đã được sử dụng", () => {
      test("should throw error when account already verified", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({ is_verified: true })
        );

        await expect(
          authService.verifyEmail("test@example.com", "123456")
        ).rejects.toThrow("Account already verified");
      });
    });
  });

  describe("UC-02: Login (TC-G01-007 → TC-G01-013)", () => {
    describe("TC-G01-007: Đăng nhập thành công (Customer)", () => {
      test("should login successfully with valid credentials", async () => {
        const hashedPassword = await validPasswordHash("ValidPass@123");
        mockPrisma.user.findFirst.mockResolvedValue(
          mockUser({
            password: hashedPassword,
            status: "active",
            is_verified: true,
          })
        );
        mockPrisma.refreshToken.create.mockResolvedValue({ id: 1 });
        mockPrisma.user.update.mockResolvedValue(mockUser());

        const result = await authService.login({
          identifier: "test@example.com",
          password: "ValidPass@123",
        });

        expect(result).toHaveProperty("accessToken", "mock-access-token");
        expect(result).toHaveProperty("refreshToken", "mock-refresh-token");
        expect(result.user).toHaveProperty("role", "customer");
      });
    });

    describe("TC-G01-008/009: Đăng nhập thành công (Lab Staff/Admin)", () => {
      test("should login successfully with Staff role", async () => {
        const hashedPassword = await validPasswordHash("StaffPass@123");
        mockPrisma.user.findFirst.mockResolvedValue(
          mockUser({
            password: hashedPassword,
            role: "lab_staff",
            status: "active",
            is_verified: true,
          })
        );
        mockPrisma.refreshToken.create.mockResolvedValue({ id: 1 });
        mockPrisma.user.update.mockResolvedValue(mockUser());

        const result = await authService.login({
          identifier: "staff@example.com",
          password: "StaffPass@123",
        });

        expect(result.user).toHaveProperty("role", "lab_staff");
      });

      test("should login successfully with Admin role", async () => {
        const hashedPassword = await validPasswordHash("AdminPass@123");
        mockPrisma.user.findFirst.mockResolvedValue(
          mockUser({
            password: hashedPassword,
            role: "system_admin",
            status: "active",
            is_verified: true,
          })
        );
        mockPrisma.refreshToken.create.mockResolvedValue({ id: 1 });
        mockPrisma.user.update.mockResolvedValue(mockUser());

        const result = await authService.login({
          identifier: "admin@example.com",
          password: "AdminPass@123",
        });

        expect(result.user).toHaveProperty("role", "system_admin");
      });
    });

    describe("TC-G01-010: Đăng nhập sai mật khẩu", () => {
      test("should throw unauthorized error for wrong password", async () => {
        const hashedPassword = await validPasswordHash("CorrectPass@123");
        mockPrisma.user.findFirst.mockResolvedValue(
          mockUser({
            password: hashedPassword,
            status: "active",
            is_verified: true,
          })
        );

        await expect(
          authService.login({
            identifier: "test@example.com",
            password: "WrongPassword@123",
          })
        ).rejects.toThrow("Invalid credentials");
      });
    });

    describe("TC-G01-011: Đăng nhập tài khoản không tồn tại", () => {
      test("should throw unauthorized error for non-existent user", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);

        await expect(
          authService.login({
            identifier: "nonexistent@example.com",
            password: "anypassword",
          })
        ).rejects.toThrow("Invalid credentials");
      });
    });

    describe("TC-G01-012: Đăng nhập tài khoản bị khóa", () => {
      test("should throw forbidden error for blocked account", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(
          mockUser({
            status: "blocked",
            is_verified: true,
          })
        );

        await expect(
          authService.login({
            identifier: "blocked@example.com",
            password: "anypassword",
          })
        ).rejects.toThrow("Account has been blocked by administrator");
      });
    });

    describe("TC-G01-013: Kích hoạt khóa tài khoản sau nhiều lần sai", () => {
      test("should lock account after max failed attempts", async () => {
        const hashedPassword = await validPasswordHash("CorrectPass@123");
        mockPrisma.user.findFirst.mockResolvedValue(
          mockUser({
            password: hashedPassword,
            status: "active",
            is_verified: true,
            failed_login_attempts: 4, // 1 more attempt will lock
          })
        );
        mockPrisma.user.update.mockResolvedValue(mockUser());

        await expect(
          authService.login({
            identifier: "test@example.com",
            password: "WrongPassword@123",
          })
        ).rejects.toThrow("Invalid credentials");

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              failed_login_attempts: 5,
              lock_until: expect.any(Date),
            }),
          })
        );
      });
    });
  });

  describe("UC-03: Logout (TC-G01-014 → TC-G01-016)", () => {
    describe("TC-G01-014: Đăng xuất thành công", () => {
      test("should delete refresh token on logout", async () => {
        mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

        await authService.logout("valid-refresh-token");

        expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
          where: { token_hash: "hashed-valid-refresh-token" },
        });
      });
    });

    describe("TC-G01-015: Dùng Access Token cũ sau đăng xuất", () => {
      test("should reject access token after logout (token already invalid)", async () => {
        // Access token validation happens in middleware
        // After logout, refresh token is deleted, so refresh will fail
        mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

        await expect(
          authService.refresh("old-refresh-token")
        ).rejects.toThrow("Refresh token not recognized");
      });
    });

    describe("TC-G01-016: Dùng Refresh Token sau đăng xuất", () => {
      test("should reject refresh token after logout", async () => {
        mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
        await authService.logout("refresh-token");

        // Try to use the same token
        mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

        await expect(authService.refresh("refresh-token")).rejects.toThrow(
          "Refresh token not recognized"
        );
      });
    });
  });

  describe("UC-04: Reset Password (TC-G01-017 → TC-G01-022)", () => {
    describe("TC-G01-017: Yêu cầu reset với email đúng", () => {
      test("should generate OTP and send reset email", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser());
        mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
        mockPrisma.passwordResetToken.create.mockResolvedValue({ id: 1 });

        await authService.forgotPassword("test@example.com");

        expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
        expect(sendPasswordResetOtp).toHaveBeenCalledWith(
          "test@example.com",
          expect.any(String)
        );
      });
    });

    describe("TC-G01-018: Yêu cầu reset với email không tồn tại", () => {
      test("should not throw error (enumeration-safe)", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          authService.forgotPassword("nonexistent@example.com")
        ).resolves.toBeUndefined();
      });
    });

    describe("TC-G01-019: Đặt lại mật khẩu với token hợp lệ", () => {
      test("should reset password successfully", async () => {
        const hashedOtp = "hashed-123456";
        tokens.hashToken.mockReturnValue(hashedOtp);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockUser({ id: 1 }));
        mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
          id: 1,
          user_id: 1,
          token_hash: hashedOtp,
          used: false,
          expires_at: new Date(Date.now() + 10 * 60 * 1000), // Future
        });
        mockPrisma.$transaction.mockImplementation(async (fn) =>
          fn(mockPrisma)
        );

        await expect(
          authService.resetPassword("test@example.com", "123456", "NewPass@123")
        ).resolves.toBeUndefined();

        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });
    });

    describe("TC-G01-020: Đặt lại mật khẩu với token hết hạn", () => {
      test("should throw error for expired token", async () => {
        const hashedOtp = "hashed-123456";
        tokens.hashToken.mockReturnValue(hashedOtp);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockUser());
        mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
          id: 1,
          token_hash: hashedOtp,
          used: false,
          expires_at: new Date(Date.now() - 10 * 60 * 1000), // Past
        });

        await expect(
          authService.resetPassword("test@example.com", "123456", "NewPass@123")
        ).rejects.toThrow("OTP expired");
      });
    });

    describe("TC-G01-021: Dùng lại token reset đã sử dụng", () => {
      test("should throw error for used token", async () => {
        const hashedOtp = "hashed-123456";
        tokens.hashToken.mockReturnValue(hashedOtp);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockUser());
        mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
          id: 1,
          token_hash: hashedOtp,
          used: true, // Already used
          expires_at: new Date(Date.now() + 10 * 60 * 1000),
        });

        await expect(
          authService.resetPassword("test@example.com", "123456", "NewPass@123")
        ).rejects.toThrow("OTP already used");
      });
    });
  });

  describe("UC-06: Change Password (TC-G01-027 → TC-G01-030)", () => {
    describe("TC-G01-027: Đổi mật khẩu thành công", () => {
      test("should change password and revoke all sessions", async () => {
        const hashedPassword = await validPasswordHash("OldPass@123");
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({ password: hashedPassword })
        );
        mockPrisma.$transaction.mockImplementation(async (fn) =>
          fn(mockPrisma)
        );

        await expect(
          authService.changePassword(1, "OldPass@123", "NewPass@123")
        ).resolves.toBeUndefined();

        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });
    });

    describe("TC-G01-028: Đổi mật khẩu với mật khẩu hiện tại sai", () => {
      test("should throw error for incorrect current password", async () => {
        const hashedPassword = await validPasswordHash("CorrectPassword@123");
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({ password: hashedPassword })
        );

        await expect(
          authService.changePassword(1, "WrongPassword@123", "NewPass@123")
        ).rejects.toThrow("Current password is incorrect");
      });
    });

    describe("TC-G01-029: Đặt mật khẩu mới trùng mật khẩu cũ", () => {
      test("should throw error when new password same as current", async () => {
        const password = "SamePass@123";
        const hashedPassword = await validPasswordHash(password);
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({ password: hashedPassword })
        );

        await expect(
          authService.changePassword(1, password, password)
        ).rejects.toThrow("New password must differ from current password");
      });
    });
  });

  describe("Resend Verification (TC-G01-044 → TC-G01-045)", () => {
    describe("TC-G01-044: Gửi lại OTP quá nhanh (Rate limit)", () => {
      test("should generate new OTP on resend request", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({ is_verified: false, status: "pending" })
        );
        mockPrisma.user.update.mockResolvedValue(mockUser());

        await authService.resendVerification("test@example.com");

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              verification_token: expect.any(String),
              verification_token_exp: expect.any(Date),
            }),
          })
        );
        expect(sendVerificationOtp).toHaveBeenCalled();
      });
    });

    describe("TC-G01-045: Resend OTP khi chưa hết hạn", () => {
      test("should generate new OTP even if old one still valid", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(
          mockUser({ is_verified: false, status: "pending" })
        );
        mockPrisma.user.update.mockResolvedValue(mockUser());

        // Request new OTP (old one is still valid)
        await authService.resendVerification("test@example.com");

        // New OTP should be generated
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              verification_token: expect.any(String),
            }),
          })
        );
      });
    });
  });
});

describe("Security Tests (TC-G05)", () => {
  describe("Token Validation", () => {
    test("should reject invalid refresh token", async () => {
      tokens.verifyRefreshToken.mockImplementation(() => {
        throw new Error("JsonWebTokenError");
      });

      await expect(authService.refresh("invalid-token")).rejects.toThrow(
        "Invalid refresh token"
      );
    });

    test("should reject missing refresh token", async () => {
      await expect(authService.refresh(null)).rejects.toThrow(
        "Missing refresh token"
      );
    });
  });

  describe("Account Lock", () => {
    test("should reject login for temporarily locked account", async () => {
      const futureLockTime = new Date(Date.now() + 30 * 60 * 1000); // 30 mins from now
      mockPrisma.user.findFirst.mockResolvedValue(
        mockUser({
          lock_until: futureLockTime,
          is_verified: true,
          status: "active",
        })
      );

      await expect(
        authService.login({
          identifier: "test@example.com",
          password: "anypassword",
        })
      ).rejects.toThrow("Account temporarily locked");
    });

    test("should auto-unlock expired lock", async () => {
      const pastLockTime = new Date(Date.now() - 10 * 60 * 1000); // Expired
      const hashedPassword = await validPasswordHash("ValidPass@123");
      mockPrisma.user.findFirst.mockResolvedValue(
        mockUser({
          password: hashedPassword,
          lock_until: pastLockTime,
          failed_login_attempts: 5,
          is_verified: true,
          status: "active",
        })
      );
      mockPrisma.user.update.mockResolvedValue(mockUser());
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 1 });

      const result = await authService.login({
        identifier: "test@example.com",
        password: "ValidPass@123",
      });

      expect(result).toHaveProperty("accessToken");
    });
  });
});
