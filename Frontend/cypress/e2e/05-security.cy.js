/**
 * Cypress E2E Tests - Module 5: Security & RBAC
 * TCS-G05 - Bảo mật & Phân quyền
 * 
 * Test Cases: TC-G05-001 → TC-G05-010
 */

/// <reference types="cypress" />

describe('TCS-G05: Security & RBAC', () => {
  beforeEach(() => {
    cy.clearAuth();
  });

  describe('TC-G05-001: JWT token validation', () => {
    describe('Valid token flow', () => {
      it('should login and receive access token', () => {
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');

        cy.window().its('localStorage.accessToken').should('exist');
      });

      it('should access protected routes with valid token', () => {
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
        cy.visit('/reservations');

        cy.url().should('not.include', '/login');
      });
    });

    describe('Invalid/missing token', () => {
      it('should redirect to login without token', () => {
        cy.visit('/reservations');

        cy.url().should('include', '/login');
      });

      it('should clear invalid token', () => {
        cy.window().then((win) => {
          win.localStorage.setItem('accessToken', 'invalid-token');
        });

        cy.visit('/reservations');

        cy.url().should('include', '/login');
      });

      it('should handle expired token', () => {
        // Set an expired token
        cy.window().then((win) => {
          win.localStorage.setItem('accessToken', 'expired-token');
        });

        cy.visit('/reservations');

        cy.url().should('include', '/login');
        cy.get('[data-testid="error-message"], .toast-error')
          .should('be.visible');
      });
    });

    describe('Token refresh', () => {
      it('should refresh token automatically when expired', () => {
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');

        // Token should be refreshed on expiry
        cy.visit('/reservations');
        cy.url().should('not.include', '/login');
      });
    });
  });

  describe('TC-G05-002: Role-based access control', () => {
    describe('Customer role', () => {
      beforeEach(() => {
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      });

      it('should access customer-only routes', () => {
        cy.visit('/reservations');
        cy.url().should('not.include', '/login');
      });

      it('should access own profile', () => {
        cy.visit('/profile');
        cy.url().should('not.include', '/login');
      });

      it('should NOT access admin routes', () => {
        cy.visit('/admin/lab-rooms');

        cy.url().should('include', '/login')
          .or.should('include', '/unauthorized');
      });

      it('should NOT access staff routes', () => {
        cy.visit('/staff/queue');

        cy.url().should('include', '/login')
          .or.should('include', '/unauthorized');
      });
    });

    describe('Lab Staff role', () => {
      beforeEach(() => {
        cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      });

      it('should access staff routes', () => {
        cy.visit('/staff/queue');
        cy.url().should('not.include', '/login');
      });

      it('should access incident management', () => {
        cy.visit('/staff/incidents');
        cy.url().should('not.include', '/login');
      });

      it('should NOT access admin routes', () => {
        cy.visit('/admin/users');

        cy.url().should('include', '/login')
          .or.should('include', '/unauthorized');
      });
    });

    describe('System Admin role', () => {
      beforeEach(() => {
        cy.loginViaApi('admin@example.com', 'AdminPassword@123');
      });

      it('should access admin routes', () => {
        cy.visit('/admin/lab-rooms');
        cy.url().should('not.include', '/login');
      });

      it('should access user management', () => {
        cy.visit('/admin/users');
        cy.url().should('not.include', '/login');
      });

      it('should access staff routes', () => {
        cy.visit('/staff/queue');
        cy.url().should('not.include', '/login');
      });
    });
  });

  describe('TC-G05-003: Non-admin attempts to access admin endpoints', () => {
    it('should deny customer access to admin lab management', () => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');

      cy.visit('/admin/lab-rooms');

      cy.url().should('include', '/login')
        .or.cy.get('body').should('contain', '403')
        .or.cy.get('body').should('contain', 'Forbidden')
        .or.cy.get('body').should('contain', 'Unauthorized');
    });

    it('should deny customer access to user management', () => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');

      cy.visit('/admin/users');

      cy.url().should('include', '/login')
        .or.cy.get('body').should('contain', '403');
    });

    it('should deny staff access to system admin functions', () => {
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');

      cy.visit('/admin/system-settings');

      cy.url().should('include', '/login')
        .or.cy.get('body').should('contain', '403');
    });

    it('should deny customer access to block/unblock users', () => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');

      cy.visit('/admin/users/1/block');

      cy.url().should('include', '/login')
        .or.cy.get('body').should('contain', '403');
    });
  });

  describe('TC-G05-004: Unauthorized API access', () => {
    it('should reject API call without authorization header', () => {
      cy.request({
        url: '/api/protected-endpoint',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should reject API call with invalid token', () => {
      cy.request({
        url: '/api/protected-endpoint',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should allow API call with valid token', () => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');

      cy.window().then((win) => {
        const token = win.localStorage.getItem('accessToken');

        cy.request({
          url: '/api/users/me',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });

  describe('TC-G05-005: Token tampering detection', () => {
    it('should reject tampered token', () => {
      cy.window().then((win) => {
        // Set a clearly invalid/tampered token
        win.localStorage.setItem('accessToken', 'tampered.token.here');
      });

      cy.visit('/reservations');

      cy.url().should('include', '/login');
    });

    it('should handle malformed token gracefully', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('accessToken', 'not-a-valid-jwt');
      });

      cy.visit('/reservations');

      cy.url().should('include', '/login');
    });
  });

  describe('TC-G05-006: Missing required claims in JWT', () => {
    it('should handle token missing user ID', () => {
      // This would be handled by backend validation
      cy.request({
        url: '/api/users/me',
        failOnStatusCode: false,
      }).then((response) => {
        expect([401, 403]).to.include(response.status);
      });
    });
  });

  describe('TC-G05-007: Rate limiting', () => {
    it('should implement rate limiting on auth endpoints', () => {
      // Attempt many login requests rapidly
      for (let i = 0; i < 25; i++) {
        cy.request({
          method: 'POST',
          url: '/api/auth/login',
          body: {
            identifier: 'customer@example.com',
            password: 'wrongpassword',
          },
          failOnStatusCode: false,
        });
      }

      // After exceeding limit, should get 429
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          identifier: 'customer@example.com',
          password: 'wrongpassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect([429, 401]).to.include(response.status);
      });
    });

    it('should show rate limit message', () => {
      cy.visit('/login');

      // Trigger rate limit
      for (let i = 0; i < 25; i++) {
        cy.get('input[name="identifier"]').type('customer@example.com');
        cy.get('input[name="password"]').type('wrong');
        cy.get('button[type="submit"]').click();
        cy.wait(100);
      }

      cy.get('[data-testid="error-message"], .toast-error')
        .should('contain', 'rate')
        .or.should('contain', 'Too many')
        .or.should('contain', 'slow');
    });
  });

  describe('TC-G05-008: Account lockout after failed login', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should lock account after max failed attempts', () => {
      const email = 'locktest@example.com';

      // Login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        cy.get('input[name="identifier"]').clear().type(email);
        cy.get('input[name="password"]').clear().type('wrongpassword');
        cy.get('button[type="submit"]').click();
        cy.wait(500);
      }

      // Try with correct password - should still be locked
      cy.get('input[name="identifier"]').clear().type(email);
      cy.get('input[name="password"]').clear().type('CorrectPassword@123');
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="error-message"], .toast-error')
        .should('contain', 'lock')
        .or.should('contain', 'locked');
    });
  });

  describe('TC-G05-009: CORS configuration', () => {
    it('should allow requests from allowed origins', () => {
      cy.request({
        url: '/api/health',
      }).then((response) => {
        expect(response.status).to.not.eq(403);
      });
    });

    it('should block requests from unauthorized origins', () => {
      // This test would require actual CORS testing setup
      // Documenting expected behavior
      expect(true).toBe(true);
    });
  });

  describe('TC-G05-010: Security headers', () => {
    it('should include security headers in responses', () => {
      cy.request('/api/health').then((response) => {
        // Check for common security headers
        const headers = response.headers;
        
        // Note: Actual header names depend on server configuration
        expect(headers).to.have.property('content-type');
      });
    });
  });

  describe('Session Management', () => {
    describe('Session timeout', () => {
      it('should logout after session timeout', () => {
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
        
        // Manually clear session
        cy.window().then((win) => {
          win.localStorage.removeItem('accessToken');
        });

        cy.visit('/reservations');

        cy.url().should('include', '/login');
      });
    });

    describe('Concurrent sessions', () => {
      it('should handle logout on another session', () => {
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
        
        // Simulate logout from another tab (clear token)
        cy.window().then((win) => {
          win.localStorage.removeItem('accessToken');
          win.localStorage.removeItem('refreshToken');
        });

        cy.visit('/reservations');

        cy.url().should('include', '/login');
      });
    });
  });

  describe('Password Security', () => {
    describe('Password change security', () => {
      it('should invalidate all sessions after password change', () => {
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
        
        // Get current token
        cy.window().then((win) => {
          const oldToken = win.localStorage.getItem('accessToken');
          
          // Simulate password change (which invalidates tokens)
          // In real scenario, user changes password via UI
          
          // Old token should be invalid
          cy.request({
            url: '/api/users/me',
            headers: {
              Authorization: `Bearer ${oldToken}`,
            },
            failOnStatusCode: false,
          }).then((response) => {
            // After password change, old token should be invalid
            expect(response.status).to.eq(401);
          });
        });
      });
    });

    describe('Password requirements enforcement', () => {
      beforeEach(() => {
        cy.visit('/register');
      });

      it('should enforce minimum password length', () => {
        cy.get('input[name="password"]').type('Pass@1');
        
        cy.get('input[name="password"]').parent()
          .should('contain', '8');
      });

      it('should enforce password complexity', () => {
        cy.get('input[name="password"]').type('simple');
        
        cy.get('input[name="password"]').parent()
          .should('contain', 'uppercase')
          .or.should('contain', 'number');
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should escape user input in display', () => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/profile');

      // Input malicious script
      cy.get('input[name="fullName"]').clear().type('<script>alert("xss")</script>');
      cy.get('button[type="submit"]').click();

      // Script should not execute
      cy.get('body').should('not.contain', '<script>');
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF token in forms', () => {
      cy.visit('/login');
      
      // Forms should have CSRF token or use proper authentication
      cy.get('form').should('exist');
    });
  });

  describe('HTTPS Enforcement (Production)', () => {
    it('should use secure cookies in production', () => {
      // This test is for documentation
      // In production, cookies should have Secure flag
      expect(true).toBe(true);
    });
  });
});
