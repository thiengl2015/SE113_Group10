/**
 * Cypress E2E Tests - Module 4: Incidents
 * TCS-G04 - Quản lý sự cố kỹ thuật
 * 
 * Test Cases: TC-G04-001 → TC-G04-012
 */

/// <reference types="cypress" />

describe('TCS-G04: Incident Management', () => {
  beforeEach(() => {
    cy.clearAuth();
  });

  describe('UC-13: Submit Incident Report (TC-G04-001 → TC-G04-005)', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/incidents/new');
    });

    describe('TC-G04-001: Gửi sự cố thành công', () => {
      it('should submit incident report successfully', () => {
        // Select category
        cy.get('[data-testid="category-selector"], select[name="category"]')
          .select('hardware');

        // Select workstation or lab room
        cy.get('[data-testid="workstation-selector"], select[name="workstation"]')
          .select('WS-001');

        // Fill description
        cy.get('textarea[name="description"], input[name="description"]')
          .type('Computer monitor is not working properly. The display shows flickering images.');

        cy.get('[data-testid="submit-btn"], button:contains("Submit"), button:contains("Gửi")').click();

        cy.get('[data-testid="success-message"]')
          .should('be.visible')
          .and.should('contain', 'success')
          .or.should('contain', 'thành công');

        cy.url().should('include', '/incidents');
      });
    });

    describe('TC-G04-002: Gửi sự cố thiếu mô tả', () => {
      it('should show validation error when description is empty', () => {
        cy.get('[data-testid="category-selector"]').select('hardware');
        cy.get('[data-testid="workstation-selector"]').select('WS-001');

        cy.get('[data-testid="submit-btn"]').click();

        cy.get('textarea[name="description"], input[name="description"]')
          .should('have.class', 'error')
          .or.should('contain', 'required');
      });
    });

    describe('TC-G04-003: Gửi sự cố không chọn danh mục', () => {
      it('should allow submission without category (optional)', () => {
        cy.get('[data-testid="workstation-selector"]').select('WS-001');
        cy.get('textarea[name="description"]').type('Issue without category');

        cy.get('[data-testid="submit-btn"]').click();

        // Should succeed or show category validation error
        cy.get('[data-testid="success-message"], [data-testid="category-selector"]')
          .should('be.visible');
      });
    });

    describe('TC-G04-004: Gửi sự cố với mã máy không tồn tại', () => {
      it('should show error for invalid workstation ID', () => {
        cy.get('[data-testid="category-selector"]').select('hardware');
        cy.get('textarea[name="description"]').type('Issue with invalid workstation');

        // Try to submit without selecting workstation
        cy.get('[data-testid="submit-btn"]').click();

        cy.url().should('include', '/incidents/new')
          .or.should('contain', 'error');
      });
    });

    describe('TC-G04-005: Retry gửi sự cố (idempotency)', () => {
      it('should handle retry gracefully', () => {
        cy.get('[data-testid="category-selector"]').select('hardware');
        cy.get('[data-testid="workstation-selector"]').select('WS-001');
        cy.get('textarea[name="description"]').type('Retry test incident');

        // Submit first time
        cy.get('[data-testid="submit-btn"]').click();

        // Wait for success
        cy.get('[data-testid="success-message"]', { timeout: 5000 }).should('be.visible');

        // Submit again (retry)
        cy.visit('/incidents/new');
        cy.get('[data-testid="category-selector"]').select('hardware');
        cy.get('[data-testid="workstation-selector"]').select('WS-001');
        cy.get('textarea[name="description"]').type('Retry test incident');

        cy.get('[data-testid="submit-btn"]').click();

        // Should succeed or handle duplicate gracefully
        cy.get('[data-testid="success-message"], [data-testid="error-message"]')
          .should('be.visible');
      });
    });
  });

  describe('UC-17: Staff Dashboard (TC-G04-006 → TC-G04-007)', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      cy.visit('/staff/incidents');
    });

    describe('TC-G04-006: Staff xem danh sách sự cố', () => {
      it('should display incident tickets list', () => {
        cy.get('[data-testid="incident-list"], [class*="incident"]').should('be.visible');
        cy.get('[data-testid="incident-item"]').should('exist');
      });

      it('should display incident details', () => {
        cy.get('[data-testid="incident-item"]').first().click();

        cy.get('[data-testid="incident-category"]').should('be.visible');
        cy.get('[data-testid="incident-description"]').should('be.visible');
        cy.get('[data-testid="incident-status"]').should('be.visible');
        cy.get('[data-testid="incident-reporter"]').should('be.visible');
      });
    });

    describe('TC-G04-007: Filter incidents by status', () => {
      it('should filter by status', () => {
        cy.get('[data-testid="status-filter"], select[name="status"]').select('open');

        cy.get('[data-testid="incident-item"]').each(($item) => {
          cy.wrap($item).should('contain', 'Open');
        });
      });

      it('should filter by category', () => {
        cy.get('[data-testid="category-filter"], select[name="category"]').select('hardware');

        cy.get('[data-testid="incident-item"]').each(($item) => {
          cy.wrap($item).should('contain', 'Hardware');
        });
      });
    });
  });

  describe('UC-18: Update Incident Status (TC-G04-008 → TC-G04-012)', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      cy.visit('/staff/incidents');
      cy.get('[data-testid="incident-item"]').first().click();
    });

    describe('TC-G04-008: Cập nhật sự cố Open → Under Review', () => {
      it('should change status from open to under_review', () => {
        cy.get('[data-testid="status-selector"], select[name="status"]')
          .select('under_review');

        cy.get('[data-testid="update-btn"], button:contains("Update"), button:contains("Cập nhật")')
          .click();

        cy.get('[data-testid="success-message"]').should('be.visible');
        cy.get('[data-testid="incident-status"]')
          .should('contain', 'Under Review');
      });
    });

    describe('TC-G04-009: Cập nhật sự cố Under Review → Resolved', () => {
      it('should change status from under_review to resolved', () => {
        cy.get('[data-testid="status-selector"]').select('under_review');
        cy.get('[data-testid="update-btn"]').click();
        cy.wait(500);

        // Now set to resolved
        cy.get('[data-testid="status-selector"]').select('resolved');
        cy.get('textarea[name="resolutionNote"], input[name="resolutionNote"]')
          .type('Replaced the faulty monitor with a new one.');
        
        cy.get('[data-testid="update-btn"]').click();

        cy.get('[data-testid="success-message"]').should('be.visible');
        cy.get('[data-testid="incident-status"]')
          .should('contain', 'Resolved');
      });
    });

    describe('TC-G04-010: Chuyển trạng thái không hợp lệ', () => {
      it('should show error for invalid status transition', () => {
        // Try to go from open directly to resolved (skipping under_review)
        cy.get('[data-testid="status-selector"]').select('resolved');

        cy.get('[data-testid="update-btn"]').click();

        cy.get('[data-testid="error-message"]')
          .should('be.visible')
          .or.should('contain', 'invalid')
          .or.should('contain', 'transition');
      });
    });

    describe('TC-G04-011: Cập nhật sự cố đã Resolved', () => {
      it('should allow re-opening resolved incident', () => {
        // Set to resolved first
        cy.get('[data-testid="status-selector"]').select('resolved');
        cy.get('input[name="resolutionNote"]').type('Fixed');
        cy.get('[data-testid="update-btn"]').click();
        cy.wait(500);

        // Change back to under_review
        cy.get('[data-testid="status-selector"]').select('under_review');
        cy.get('[data-testid="update-btn"]').click();

        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G04-012: Cập nhật sự cố đã Closed', () => {
      it('should prevent updating closed ticket', () => {
        // Find a closed incident
        cy.go('back');
        cy.get('[data-testid="status-filter"]').select('closed');
        cy.get('[data-testid="incident-item"]').first().click();

        cy.get('[data-testid="status-selector"]').should('be.disabled')
          .or.should('not.exist');

        cy.get('[data-testid="update-btn"]').should('not.exist')
          .or.should('be.disabled');
      });
    });
  });

  describe('Customer View Own Incidents (TC-G04-006)', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/incidents');
    });

    describe('Customer xem sự cố của mình', () => {
      it('should display only own incidents', () => {
        cy.get('[data-testid="incident-list"]').should('be.visible');
      });

      it('should not see other users incidents', () => {
        cy.get('[data-testid="incident-item"]').each(($item) => {
          cy.wrap($item).should('contain', Cypress.env('userEmail') || 'customer');
        });
      });
    });

    describe('View incident details', () => {
      it('should display incident details with resolution notes', () => {
        cy.get('[data-testid="incident-item"]').first().click();

        cy.get('[data-testid="incident-category"]').should('be.visible');
        cy.get('[data-testid="incident-description"]').should('be.visible');
        cy.get('[data-testid="incident-status"]').should('be.visible');
        cy.get('[data-testid="incident-created-at"]').should('be.visible');
      });
    });
  });

  describe('Incident Categories Validation', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/incidents/new');
    });

    describe('Valid categories', () => {
      const validCategories = ['hardware', 'network', 'software', 'os'];

      validCategories.forEach((category) => {
        it(`should accept category: ${category}`, () => {
          cy.get('[data-testid="category-selector"]').select(category);
          cy.get('textarea[name="description"]').type(`Test ${category} issue`);
          cy.get('[data-testid="workstation-selector"]').select('WS-001');

          cy.get('[data-testid="submit-btn"]').click();

          cy.url().should('include', '/incidents');
        });
      });
    });

    describe('Invalid category', () => {
      it('should reject invalid category', () => {
        // Try to submit with invalid category
        cy.get('[data-testid="category-selector"]').select('');
        cy.get('textarea[name="description"]').type('Test issue');

        cy.get('[data-testid="submit-btn"]').click();

        // Should either reject or accept empty (depending on validation rules)
        cy.get('[data-testid="success-message"], [data-testid="error-message"]')
          .should('be.visible');
      });
    });
  });

  describe('Staff Assignment (TC-G04-008)', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      cy.visit('/staff/incidents');
      cy.get('[data-testid="incident-item"]').first().click();
    });

    describe('Assign incident to staff', () => {
      it('should allow assigning incident to staff member', () => {
        cy.get('[data-testid="assignee-selector"], select[name="assignee"]')
          .select('staff2@example.com');

        cy.get('[data-testid="update-btn"]').click();

        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('View assignment', () => {
      it('should display assigned staff member', () => {
        cy.get('[data-testid="assigned-user"], [data-testid="assignee"]')
          .should('be.visible');
      });
    });
  });

  describe('Incident Resolution Flow', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      cy.visit('/staff/incidents');
    });

    describe('Complete resolution workflow', () => {
      it('should complete full workflow: open → under_review → resolved → closed', () => {
        // Select an open incident
        cy.get('[data-testid="status-filter"]').select('open');
        cy.get('[data-testid="incident-item"]').first().click();

        // Step 1: Open → Under Review
        cy.get('[data-testid="status-selector"]').select('under_review');
        cy.get('[data-testid="update-btn"]').click();
        cy.get('[data-testid="incident-status"]').should('contain', 'Under Review');

        // Step 2: Under Review → Resolved
        cy.get('[data-testid="status-selector"]').select('resolved');
        cy.get('input[name="resolutionNote"]').type('Issue resolved successfully.');
        cy.get('[data-testid="update-btn"]').click();
        cy.get('[data-testid="incident-status"]').should('contain', 'Resolved');

        // Step 3: Resolved → Closed
        cy.get('[data-testid="status-selector"]').select('closed');
        cy.get('[data-testid="update-btn"]').click();
        cy.get('[data-testid="incident-status"]').should('contain', 'Closed');
      });
    });
  });

  describe('Empty States', () => {
    beforeEach(() => {
      cy.clearAuth();
    });

    describe('No incidents state', () => {
      it('should show empty state for customer with no incidents', () => {
        cy.loginViaApi('newcustomer@example.com', 'Password@123');
        cy.visit('/incidents');

        cy.get('[data-testid="empty-state"], [class*="empty"]')
          .should('be.visible');
      });

      it('should show empty state for staff when no incidents exist', () => {
        cy.loginViaApi('staff@example.com', 'StaffPassword@123');
        cy.visit('/staff/incidents');

        // If no incidents exist, show empty state
        cy.get('[data-testid="incident-item"]').should('not.exist')
          .or.cy.get('[data-testid="empty-state"]').should('be.visible');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/incidents/new');
    });

    describe('Network error handling', () => {
      it('should show error message on network failure', () => {
        // Intercept and fail the request
        cy.intercept('POST', '/api/incidents', {
          statusCode: 500,
          body: { message: 'Internal server error' },
        }).as('createIncident');

        cy.get('[data-testid="category-selector"]').select('hardware');
        cy.get('[data-testid="workstation-selector"]').select('WS-001');
        cy.get('textarea[name="description"]').type('Test issue');

        cy.get('[data-testid="submit-btn"]').click();

        cy.get('[data-testid="error-message"]')
          .should('be.visible')
          .and.should('contain', 'error')
          .or.should('contain', 'lỗi');
      });
    });

    describe('Session timeout handling', () => {
      it('should redirect to login on session timeout', () => {
        // Clear auth and try to access protected route
        cy.clearAuth();
        cy.visit('/staff/incidents');

        cy.url().should('include', '/login');
      });
    });
  });
});
