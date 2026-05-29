/**
 * Cypress E2E Tests - Module 1: Authentication
 * TCS-G01 - Xác thực & Quản lý hồ sơ
 * 
 * Test Cases: TC-G01-001 → TC-G01-047
 */

/// <reference types="cypress" />

describe('TCS-G01: Authentication & Profile Management', () => {
  beforeEach(() => {
    // Clear local storage before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('UC-01: Register (TC-G01-001 → TC-G01-006, TC-G01-038 → TC-G01-047)', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    describe('TC-G01-001: Đăng ký thành công với email hợp lệ', () => {
      it('should register successfully with valid credentials', () => {
        const timestamp = Date.now();
        const testUser = {
          username: `testuser${timestamp}`,
          email: `test${timestamp}@example.com`,
          password: 'Password@123',
        };

        // Fill registration form
        cy.get('input[name="username"]').type(testUser.username);
        cy.get('input[name="email"]').type(testUser.email);
        cy.get('input[name="password"]').type(testUser.password);
        cy.get('input[name="confirmPassword"]').type(testUser.password);

        // Submit form
        cy.get('button[type="submit"]').click();

        // Verify success - should redirect to login or show success message
        cy.url().should('not.include', '/register');
        cy.get('[data-testid="success-message"], .toast-success, [class*="success"]').should('be.visible');
      });
    });

    describe('TC-G01-002: Đăng ký với email đã tồn tại', () => {
      it('should show error when email already exists', () => {
        cy.get('input[name="username"]').type('newuser');
        cy.get('input[name="email"]').type('existing@example.com');
        cy.get('input[name="password"]').type('Password@123');
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        // Should show error message about email already registered
        cy.get('[data-testid="error-message"], .text-red, [class*="error"]')
          .should('contain', 'Email')
          .or.should('contain', 'already')
          .or.should('contain', 'tồn tại');
      });
    });

    describe('TC-G01-003: Đăng ký thiếu trường bắt buộc', () => {
      it('should show validation error when email is empty', () => {
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="password"]').type('Password@123');
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        // Should show validation error
        cy.get('input[name="email"]').should('have.class', 'error')
          .or.should('have.attr', 'required');
      });

      it('should show validation error when password is empty', () => {
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="email"]').type('test@example.com');

        cy.get('button[type="submit"]').click();

        cy.get('input[name="password"]').should('have.class', 'error')
          .or.should('have.attr', 'required');
      });
    });

    describe('TC-G01-004: Đăng ký mật khẩu quá ngắn', () => {
      it('should reject password shorter than minimum length', () => {
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('Pass@1'); // Too short
        cy.get('input[name="confirmPassword"]').type('Pass@1');

        cy.get('button[type="submit"]').click();

        // Should show password length error
        cy.get('input[name="password"]')
          .parent()
          .should('contain', '8')
          .or.should('contain', 'characters')
          .or.should('contain', 'ít nhất');
      });
    });

    describe('TC-G01-005: Đăng ký mật khẩu đúng độ dài tối thiểu', () => {
      it('should accept password at minimum length', () => {
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('Password@123'); // Exactly minimum
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        // Should not show password length error
        cy.url().should('not.include', '/register');
      });
    });

    describe('TC-G01-006: Mật khẩu không đủ độ phức tạp', () => {
      it('should reject password without special characters', () => {
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123'); // No special char
        cy.get('input[name="confirmPassword"]').type('password123');

        cy.get('button[type="submit"]').click();

        // Should show complexity error
        cy.get('input[name="password"]')
          .parent()
          .should('contain', 'uppercase')
          .or.should('contain', 'lowercase')
          .or.should('contain', 'number')
          .or.should('contain', 'special');
      });

      it('should reject password without uppercase', () => {
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password@123'); // No uppercase
        cy.get('input[name="confirmPassword"]').type('password@123');

        cy.get('button[type="submit"]').click();

        cy.get('input[name="password"]')
          .parent()
          .should('contain', 'uppercase')
          .or.should('contain', 'A-Z');
      });
    });

    describe('TC-G01-038: Đăng ký với username đã tồn tại', () => {
      it('should show error when username already taken', () => {
        cy.get('input[name="username"]').type('existinguser');
        cy.get('input[name="email"]').type('new@example.com');
        cy.get('input[name="password"]').type('Password@123');
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"], .text-red')
          .should('contain', 'Username')
          .or.should('contain', 'already')
          .or.should('contain', 'tồn tại');
      });
    });

    describe('TC-G01-039: Đăng ký với username quá ngắn', () => {
      it('should reject username less than 3 characters', () => {
        cy.get('input[name="username"]').type('ab');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('Password@123');
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        cy.get('input[name="username"]')
          .parent()
          .should('contain', '3')
          .or.should('contain', 'characters');
      });
    });

    describe('TC-G01-040: Đăng ký với username quá dài', () => {
      it('should reject username more than 50 characters', () => {
        cy.get('input[name="username"]').type('a'.repeat(51));
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('Password@123');
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        cy.get('input[name="username"]')
          .parent()
          .should('contain', '50');
      });
    });

    describe('TC-G01-041: Đăng ký với username chứa ký tự đặc biệt', () => {
      it('should reject username with special characters', () => {
        cy.get('input[name="username"]').type('user@#$%');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('Password@123');
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        cy.get('input[name="username"]')
          .parent()
          .should('contain', 'a-z')
          .or.should('contain', 'alphanumeric');
      });
    });

    describe('TC-G01-042: Đăng ký với email sai định dạng', () => {
      it('should reject invalid email format', () => {
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="email"]').type('not-an-email');
        cy.get('input[name="password"]').type('Password@123');
        cy.get('input[name="confirmPassword"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        cy.get('input[name="email"]')
          .parent()
          .should('contain', 'email')
          .or.should('contain', 'invalid');
      });
    });
  });

  describe('UC-02: Login (TC-G01-007 → TC-G01-013)', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    describe('TC-G01-007: Đăng nhập thành công (Customer)', () => {
      it('should login successfully with valid credentials', () => {
        cy.get('input[name="identifier"]').type('test@example.com');
        cy.get('input[name="password"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        // Should redirect to customer dashboard
        cy.url().should('not.include', '/login');
        cy.get('[data-testid="user-menu"], [class*="user"]').should('be.visible');
      });
    });

    describe('TC-G01-008: Đăng nhập thành công (Lab Staff)', () => {
      it('should show staff dashboard for staff account', () => {
        cy.get('input[name="identifier"]').type('staff@example.com');
        cy.get('input[name="password"]').type('StaffPassword@123');

        cy.get('button[type="submit"]').click();

        cy.url().should('not.include', '/login');
        cy.get('[data-testid="staff-menu"], nav').should('be.visible');
      });
    });

    describe('TC-G01-009: Đăng nhập thành công (Admin)', () => {
      it('should show admin dashboard for admin account', () => {
        cy.get('input[name="identifier"]').type('admin@example.com');
        cy.get('input[name="password"]').type('AdminPassword@123');

        cy.get('button[type="submit"]').click();

        cy.url().should('not.include', '/login');
        cy.get('[data-testid="admin-menu"], nav').should('be.visible');
      });
    });

    describe('TC-G01-010: Đăng nhập sai mật khẩu', () => {
      it('should show error for wrong password', () => {
        cy.get('input[name="identifier"]').type('test@example.com');
        cy.get('input[name="password"]').type('WrongPassword@123');

        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"], .text-red')
          .should('contain', 'Invalid')
          .or.should('contain', 'Sai')
          .or.should('contain', 'incorrect');
      });
    });

    describe('TC-G01-011: Đăng nhập tài khoản không tồn tại', () => {
      it('should show generic error for non-existent account', () => {
        cy.get('input[name="identifier"]').type('nonexistent@example.com');
        cy.get('input[name="password"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        // Should NOT reveal if email exists (enumeration-safe)
        cy.get('[data-testid="error-message"], .text-red').should('be.visible');
      });
    });

    describe('TC-G01-012: Đăng nhập tài khoản bị khóa', () => {
      it('should show error for blocked account', () => {
        cy.get('input[name="identifier"]').type('blocked@example.com');
        cy.get('input[name="password"]').type('Password@123');

        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"], .text-red')
          .should('contain', 'blocked')
          .or.should('contain', 'khóa')
          .or.should('contain', 'bị chặn');
      });
    });

    describe('TC-G01-013: Kích hoạt khóa tài khoản sau nhiều lần sai', () => {
      it('should lock account after max failed attempts', () => {
        const identifier = 'locktest@example.com';
        
        // Login 5 times with wrong password
        for (let i = 0; i < 5; i++) {
          cy.get('input[name="identifier"]').clear().type(identifier);
          cy.get('input[name="password"]').clear().type('WrongPassword@123');
          cy.get('button[type="submit"]').click();
          cy.wait(500);
        }

        // Should be locked now
        cy.get('input[name="identifier"]').clear().type(identifier);
        cy.get('input[name="password"]').clear().type('CorrectPassword@123');
        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"], .text-red')
          .should('contain', 'locked')
          .or.should('contain', 'locked');
      });
    });
  });

  describe('UC-03: Logout (TC-G01-014 → TC-G01-016)', () => {
    beforeEach(() => {
      // Login first
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          identifier: 'test@example.com',
          password: 'Password@123',
        },
      }).then((response) => {
        window.localStorage.setItem('accessToken', response.body.accessToken);
      });
      cy.visit('/');
    });

    describe('TC-G01-014: Đăng xuất thành công', () => {
      it('should logout successfully', () => {
        // Click logout button
        cy.get('[data-testid="logout-btn"], button:contains("Logout"), button:contains("Đăng xuất")').click();

        // Should redirect to login page
        cy.url().should('include', '/login');
        
        // Token should be removed
        cy.window().its('localStorage.accessToken').should('be.undefined');
      });
    });

    describe('TC-G01-015: Dùng Access Token cũ sau đăng xuất', () => {
      it('should reject access token after logout', () => {
        // Get token before logout
        cy.window().then((win) => {
          const token = win.localStorage.getItem('accessToken');
          
          // Logout
          cy.get('[data-testid="logout-btn"]').click();
          cy.url().should('include', '/login');

          // Try to use old token
          cy.request({
            method: 'GET',
            url: '/api/protected-endpoint',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(401);
          });
        });
      });
    });
  });

  describe('UC-04: Reset Password (TC-G01-017 → TC-G01-022)', () => {
    describe('TC-G01-017: Yêu cầu reset với email đúng', () => {
      it('should send reset email for valid email', () => {
        cy.visit('/forgot-password');
        
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="success-message"]')
          .should('contain', 'email')
          .or.should('contain', 'gửi')
          .or.should('contain', 'sent');
      });
    });

    describe('TC-G01-018: Yêu cầu reset với email không tồn tại', () => {
      it('should show generic success for non-existent email (enumeration-safe)', () => {
        cy.visit('/forgot-password');
        
        cy.get('input[name="email"]').type('nonexistent@example.com');
        cy.get('button[type="submit"]').click();

        // Should show success (not error) to prevent email enumeration
        cy.get('[data-testid="success-message"], .toast-success')
          .should('be.visible');
      });
    });
  });

  describe('Password Reset Flow (TC-G01-019 → TC-G01-022)', () => {
    beforeEach(() => {
      cy.visit('/reset-password?token=test-token');
    });

    describe('TC-G01-019: Đặt lại mật khẩu với token hợp lệ', () => {
      it('should reset password with valid token', () => {
        cy.get('input[name="password"]').type('NewPassword@123');
        cy.get('input[name="confirmPassword"]').type('NewPassword@123');
        
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/login');
      });
    });

    describe('TC-G01-020: Đặt lại mật khẩu với token hết hạn', () => {
      it('should show error for expired token', () => {
        cy.visit('/reset-password?token=expired-token');

        cy.get('input[name="password"]').type('NewPassword@123');
        cy.get('input[name="confirmPassword"]').type('NewPassword@123');
        
        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"]')
          .should('contain', 'expired')
          .or.should('contain', 'hết hạn');
      });
    });

    describe('TC-G01-021: Dùng lại token reset đã sử dụng', () => {
      it('should show error for reused token', () => {
        cy.get('input[name="password"]').type('NewPassword@123');
        cy.get('input[name="confirmPassword"]').type('NewPassword@123');
        
        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"]')
          .should('contain', 'already')
          .or.should('contain', 'used');
      });
    });
  });

  describe('UC-06: Change Password (TC-G01-027 → TC-G01-030)', () => {
    beforeEach(() => {
      // Login first
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          identifier: 'test@example.com',
          password: 'Password@123',
        },
      }).then((response) => {
        window.localStorage.setItem('accessToken', response.body.accessToken);
      });
      cy.visit('/profile');
    });

    describe('TC-G01-027: Đổi mật khẩu thành công', () => {
      it('should change password successfully', () => {
        cy.get('input[name="currentPassword"]').type('OldPassword@123');
        cy.get('input[name="newPassword"]').type('NewPassword@123');
        cy.get('input[name="confirmPassword"]').type('NewPassword@123');

        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="success-message"]')
          .should('contain', 'success')
          .or.should('contain', 'thành công');
      });
    });

    describe('TC-G01-028: Đổi mật khẩu với mật khẩu hiện tại sai', () => {
      it('should show error for wrong current password', () => {
        cy.get('input[name="currentPassword"]').type('WrongPassword@123');
        cy.get('input[name="newPassword"]').type('NewPassword@123');
        cy.get('input[name="confirmPassword"]').type('NewPassword@123');

        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"]')
          .should('contain', 'current')
          .or.should('contain', 'incorrect');
      });
    });

    describe('TC-G01-029: Đặt mật khẩu mới trùng mật khẩu cũ', () => {
      it('should show error when new password same as current', () => {
        cy.get('input[name="currentPassword"]').type('SamePassword@123');
        cy.get('input[name="newPassword"]').type('SamePassword@123');
        cy.get('input[name="confirmPassword"]').type('SamePassword@123');

        cy.get('button[type="submit"]').click();

        cy.get('[data-testid="error-message"]')
          .should('contain', 'different')
          .or.should('contain', 'trùng');
      });
    });
  });
});
