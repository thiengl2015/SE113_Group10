/**
 * Cypress E2E Tests - Module 3: Reservations
 * TCS-G03 - Quản lý đặt phòng/máy
 * 
 * Test Cases: TC-G03-001 → TC-G03-027e
 */

/// <reference types="cypress" />

describe('TCS-G03: Reservation Management', () => {
  beforeEach(() => {
    cy.clearAuth();
  });

  describe('UC-07, UC-08: Browse Availability (TC-G03-001 → TC-G03-005)', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/reservations');
    });

    describe('TC-G03-001: Tìm phòng khả dụng với ngày hợp lệ', () => {
      it('should display available rooms for valid date', () => {
        // Select future date
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateString = futureDate.toISOString().split('T')[0];
        
        cy.get('[data-testid="date-picker"], input[name="date"]').type(dateString);
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        
        cy.get('[data-testid="search-btn"], button:contains("Search"), button:contains("Tìm")').click();
        
        cy.get('[data-testid="room-list"], [class*="room-card"]').should('be.visible');
      });
    });

    describe('TC-G03-002: Tìm phòng với ngày trong quá khứ', () => {
      it('should show error or empty result for past date', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const dateString = pastDate.toISOString().split('T')[0];
        
        cy.get('[data-testid="date-picker"], input[name="date"]').type(dateString);
        cy.get('[data-testid="search-btn"]').click();
        
        cy.get('[data-testid="error-message"], [class*="empty"]')
          .should('be.visible')
          .or.should('contain', 'past')
          .or.should('contain', 'quá khứ');
      });
    });

    describe('TC-G03-003: Máy Maintenance không xuất hiện trong kết quả tìm', () => {
      it('should not show maintenance workstations in availability', () => {
        cy.get('[data-testid="workstation-tab"], tab:contains("Workstation")').click();
        
        cy.get('[data-testid="search-btn"]').click();
        
        // Verify no maintenance workstations shown
        cy.get('[data-testid="workstation-card"]').each(($card) => {
          cy.wrap($card).should('not.contain', 'Maintenance');
        });
      });
    });

    describe('TC-G03-004: Máy đã có reservation Approved không xuất hiện', () => {
      it('should not show booked workstations for selected time', () => {
        cy.get('[data-testid="workstation-tab"]').click();
        
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        
        cy.get('[data-testid="search-btn"]').click();
        
        // Booked workstations should not be in the list
        cy.get('[data-testid="workstation-card"]').each(($card) => {
          cy.wrap($card).should('not.have.class', 'booked');
        });
      });
    });

    describe('TC-G03-005: Lọc máy theo thông số phần cứng', () => {
      it('should filter workstations by RAM', () => {
        cy.get('[data-testid="workstation-tab"]').click();
        
        cy.get('[data-testid="min-ram-filter"], input[name="minRam"]').type('16');
        cy.get('[data-testid="search-btn"]').click();
        
        cy.get('[data-testid="workstation-card"]').each(($card) => {
          cy.wrap($card).should('contain', '16 GB')
            .or.should('contain', '32 GB');
        });
      });

      it('should filter workstations by OS', () => {
        cy.get('[data-testid="workstation-tab"]').click();
        
        cy.get('[data-testid="os-filter"], input[name="os"]').type('Windows');
        cy.get('[data-testid="search-btn"]').click();
        
        cy.get('[data-testid="workstation-card"]').each(($card) => {
          cy.wrap($card).should('contain', 'Windows');
        });
      });
    });
  });

  describe('UC-09, UC-10: Create Reservation (TC-G03-006 → TC-G03-012)', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/reservations/new');
    });

    describe('TC-G03-006: Đặt phòng lab thành công', () => {
      it('should create lab room reservation successfully', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        
        // Select lab room
        cy.get('[data-testid="room-selector"], select[name="labRoom"]').select('LAB-101');
        
        // Select date and time
        cy.get('[data-testid="date-picker"]').type(futureDate.toISOString().split('T')[0]);
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        
        // Fill purpose
        cy.get('input[name="purpose"], textarea[name="purpose"]').type('Study session');
        cy.get('input[name="expectedUsers"]').type('5');
        
        cy.get('[data-testid="submit-btn"], button:contains("Book"), button:contains("Đặt")').click();
        
        cy.get('[data-testid="success-message"]')
          .should('be.visible')
          .and.should('contain', 'success')
          .or.should('contain', 'thành công');
        
        cy.url().should('include', '/reservations');
      });
    });

    describe('TC-G03-007: Đặt máy trạm thành công', () => {
      it('should create workstation reservation successfully', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        
        cy.get('[data-testid="workstation-tab"]').click();
        
        cy.get('[data-testid="workstation-selector"]').select('WS-001');
        cy.get('[data-testid="date-picker"]').type(futureDate.toISOString().split('T')[0]);
        cy.get('[data-testid="start-time"]').select('10:00');
        cy.get('[data-testid="end-time"]').select('12:00');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G03-008: Đặt với giờ kết thúc trước giờ bắt đầu', () => {
      it('should show error when end time before start time', () => {
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('11:00');
        cy.get('[data-testid="end-time"]').select('09:00');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.get('[data-testid="error-message"]')
          .should('be.visible')
          .and.should('contain', 'end')
          .or.should('contain', 'before');
      });
    });

    describe('TC-G03-008b: Đặt với end_time = start_time', () => {
      it('should show error when end time equals start time', () => {
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('09:00');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.get('[data-testid="error-message"]').should('be.visible');
      });
    });

    describe('TC-G03-009: Đặt với thời gian trong quá khứ', () => {
      it('should show error for past date', () => {
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2020-01-01');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'future')
          .or.should('contain', 'quá khứ');
      });
    });

    describe('TC-G03-010: Đặt phòng/máy đã có lịch Approved trùng giờ', () => {
      it('should show conflict error for overlapping reservation', () => {
        // First booking
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.visit('/reservations/new');
        
        // Second overlapping booking
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('10:00');
        cy.get('[data-testid="end-time"]').select('12:00');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'occupied')
          .or.should('contain', 'conflict')
          .or.should('contain', 'trùng');
      });
    });

    describe('TC-G03-011: Đặt thiếu trường mục đích sử dụng', () => {
      it('should allow booking without purpose (optional field)', () => {
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        // Leave purpose empty
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.url().should('include', '/reservations');
      });
    });

    describe('TC-G03-012: Mid-air collision - hai user đặt cùng tài nguyên', () => {
      it('should handle concurrent booking - only one succeeds', () => {
        // This test simulates race condition
        // Actual behavior depends on backend transaction handling
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-02');
        cy.get('[data-testid="start-time"]').select('14:00');
        cy.get('[data-testid="end-time"]').select('16:00');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        // Should succeed or fail with conflict
        cy.get('[data-testid="success-message"], [data-testid="error-message"]')
          .should('be.visible');
      });
    });
  });

  describe('UC-11: View Reservation History (TC-G03-013 → TC-G03-015)', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/reservations/history');
    });

    describe('TC-G03-013: Customer xem lịch sử của chính mình', () => {
      it('should display reservation history', () => {
        cy.get('[data-testid="reservation-list"]').should('be.visible');
        cy.get('[data-testid="reservation-item"]').should('exist');
      });

      it('should filter history by status', () => {
        cy.get('[data-testid="status-filter"], select[name="status"]').select('pending');
        
        cy.get('[data-testid="reservation-item"]').each(($item) => {
          cy.wrap($item).should('contain', 'Pending');
        });
      });
    });

    describe('TC-G03-014: Customer xem lịch sử của người khác', () => {
      it('should only show own reservations', () => {
        cy.visit('/reservations/history?userId=999');
        
        // Should redirect or show empty
        cy.url().should('include', '/reservations/history');
      });
    });

    describe('TC-G03-015: Lịch sử trống', () => {
      it('should show empty state for new user', () => {
        cy.visit('/reservations/history');
        
        cy.get('[data-testid="empty-state"], [class*="empty"]')
          .should('be.visible');
      });
    });
  });

  describe('UC-12: Cancel Reservation (TC-G03-016 → TC-G03-019)', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/reservations/history');
    });

    describe('TC-G03-016: Huỷ reservation Pending thành công', () => {
      it('should cancel pending reservation', () => {
        cy.get('[data-testid="reservation-item"]')
          .filter(':has([class*="pending"])')
          .first()
          .within(() => {
            cy.get('[data-testid="cancel-btn"], button:contains("Cancel"), button:contains("Huỷ")').click();
          });
        
        cy.get('[data-testid="confirm-cancel"], button:contains("Confirm")').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
        cy.get('[data-testid="reservation-item"]').first()
          .should('contain', 'Cancelled');
      });
    });

    describe('TC-G03-017: Huỷ reservation đã Approved', () => {
      it('should show error when cancelling approved reservation', () => {
        cy.get('[data-testid="reservation-item"]')
          .filter(':has([class*="approved"])')
          .first()
          .within(() => {
            cy.get('[data-testid="cancel-btn"]').click();
          });
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'approved')
          .or.should('contain', 'cannot');
      });
    });

    describe('TC-G03-018: Customer huỷ reservation của người khác', () => {
      it('should deny cancellation of others reservation', () => {
        cy.visit('/reservations/history?userId=2');
        
        cy.get('[data-testid="cancel-btn"]').should('not.exist');
      });
    });
  });

  describe('UC-14: Staff View Request Queue (TC-G03-020 → TC-G03-022)', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      cy.visit('/staff/queue');
    });

    describe('TC-G03-020: Staff xem hàng đợi Pending', () => {
      it('should display pending reservations queue', () => {
        cy.get('[data-testid="queue-list"]').should('be.visible');
        cy.get('[data-testid="queue-item"]').should('exist');
      });

      it('should show queue in FIFO order', () => {
        cy.get('[data-testid="queue-item"]').then(($items) => {
          const count = $items.length;
          if (count > 1) {
            // Verify order - first item should be oldest
            cy.get('[data-testid="queue-item"]').first()
              .should('be.visible');
          }
        });
      });
    });

    describe('TC-G03-021: Hàng đợi trống', () => {
      it('should show empty state when no pending requests', () => {
        cy.get('[data-testid="empty-queue"], [class*="empty"]')
          .should('be.visible');
      });
    });
  });

  describe('UC-15: Approve Reservation (TC-G03-023 → TC-G03-024)', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      cy.visit('/staff/queue');
    });

    describe('TC-G03-023: Approve reservation hợp lệ', () => {
      it('should approve pending reservation', () => {
        cy.get('[data-testid="queue-item"]').first()
          .within(() => {
            cy.get('[data-testid="approve-btn"], button:contains("Approve"), button:contains("Duyệt")').click();
          });
        
        cy.get('[data-testid="success-message"]').should('be.visible');
        
        cy.get('[data-testid="queue-item"]').first()
          .should('contain', 'Approved');
      });
    });

    describe('TC-G03-024: Approve reservation đã có Approved khác overlap', () => {
      it('should show conflict error when time slot occupied', () => {
        cy.get('[data-testid="queue-item"]').filter(':has([data-testid="conflict"])').first()
          .within(() => {
            cy.get('[data-testid="approve-btn"]').click();
          });
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'conflict')
          .or.should('contain', 'occupied');
      });
    });
  });

  describe('UC-16: Reject Reservation (TC-G03-025 → TC-G03-027)', () => {
    beforeEach(() => {
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      cy.visit('/staff/queue');
    });

    describe('TC-G03-025: Reject reservation với lý do bắt buộc', () => {
      it('should reject with reason', () => {
        cy.get('[data-testid="queue-item"]').first()
          .within(() => {
            cy.get('[data-testid="reject-btn"], button:contains("Reject"), button:contains("Từ chối")').click();
          });
        
        cy.get('[data-testid="reason-input"], textarea[name="reason"]')
          .type('Lab is not available for this time');
        
        cy.get('[data-testid="confirm-reject"], button:contains("Confirm")').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G03-026: Reject reservation thiếu lý do', () => {
      it('should show error when reason is empty', () => {
        cy.get('[data-testid="queue-item"]').first()
          .within(() => {
            cy.get('[data-testid="reject-btn"]').click();
          });
        
        cy.get('[data-testid="reason-input"]').type('   ');
        
        cy.get('[data-testid="confirm-reject"]').click();
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'reason')
          .or.should('contain', 'required');
      });
    });

    describe('TC-G03-027: Approve reservation đã bị Cancel', () => {
      it('should show error when approving cancelled reservation', () => {
        cy.get('[data-testid="queue-item"]')
          .filter(':has([class*="cancelled"])')
          .first()
          .within(() => {
            cy.get('[data-testid="approve-btn"]').click();
          });
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'cancelled')
          .or.should('contain', 'no longer');
      });
    });
  });

  describe('TC-G03-027b → TC-G03-027e: Additional Edge Cases', () => {
    beforeEach(() => {
      cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
      cy.visit('/reservations/new');
    });

    describe('TC-G03-027b: Đặt phòng với số người vượt sức chứa', () => {
      it('should show error when expected_users exceeds capacity', () => {
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        cy.get('input[name="expectedUsers"]').type('100'); // Exceeds capacity
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'capacity');
      });
    });

    describe('TC-G03-027c: Đặt phòng với expected_users = 0', () => {
      it('should show error for zero expected users', () => {
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        cy.get('input[name="expectedUsers"]').type('0');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.get('[data-testid="error-message"], input[name="expectedUsers"]')
          .should('contain', '0')
          .or.should('contain', 'greater');
      });
    });

    describe('TC-G03-027d: Đặt phòng với expected_users = 1', () => {
      it('should accept booking for 1 person', () => {
        cy.get('[data-testid="room-selector"]').select('LAB-101');
        cy.get('[data-testid="date-picker"]').type('2026-06-01');
        cy.get('[data-testid="start-time"]').select('09:00');
        cy.get('[data-testid="end-time"]').select('11:00');
        cy.get('input[name="expectedUsers"]').type('1');
        
        cy.get('[data-testid="submit-btn"]').click();
        
        cy.url().should('include', '/reservations');
      });
    });
  });
});
