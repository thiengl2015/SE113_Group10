/**
 * Cypress E2E Tests - Module 2: Lab Rooms & Workstations
 * TCS-G02 - Quản lý phòng lab & thiết bị
 * 
 * Test Cases: TC-G02-001 → TC-G02-025
 */

/// <reference types="cypress" />

describe('TCS-G02: Lab Rooms & Workstations Management', () => {
  beforeEach(() => {
    // Clear and setup auth
    cy.clearAuth();
    
    // Login as admin for CRUD operations
    cy.loginViaApi('admin@example.com', 'AdminPassword@123');
  });

  describe('UC-20: Create Lab Room (TC-G02-001 → TC-G02-004)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
    });

    describe('TC-G02-001: Tạo phòng lab mới hợp lệ', () => {
      it('should create a new lab room successfully', () => {
        const timestamp = Date.now();
        
        cy.get('[data-testid="add-room-btn"], button:contains("Add"), button:contains("Tạo")').click();
        
        // Fill form
        cy.get('input[name="roomCode"]').type(`LAB-${timestamp}`);
        cy.get('input[name="name"]').type(`Test Lab ${timestamp}`);
        cy.get('input[name="location"]').type('Building A, Floor 1');
        cy.get('input[name="capacity"]').type('30');
        cy.get('textarea[name="description"]').type('New test lab room');
        
        cy.get('button[type="submit"], button:contains("Save"), button:contains("Lưu")').click();
        
        // Verify success
        cy.get('[data-testid="success-message"], .toast-success').should('be.visible');
        cy.get(`[data-testid="room-code"]:contains("LAB-${timestamp}")`).should('exist');
      });
    });

    describe('TC-G02-002: Tạo phòng với mã phòng trùng', () => {
      it('should show error when room code already exists', () => {
        cy.get('[data-testid="add-room-btn"]').click();
        
        cy.get('input[name="roomCode"]').type('LAB-EXISTING');
        cy.get('input[name="name"]').type('Duplicate Room');
        cy.get('input[name="capacity"]').type('20');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('[data-testid="error-message"], .text-red')
          .should('contain', 'already')
          .or.should('contain', 'trùng')
          .or.should('contain', 'exists');
      });
    });

    describe('TC-G02-003: Tạo phòng với sức chứa = 0', () => {
      it('should show validation error for zero capacity', () => {
        cy.get('[data-testid="add-room-btn"]').click();
        
        cy.get('input[name="roomCode"]').type('LAB-ZERO');
        cy.get('input[name="name"]').type('Zero Capacity Lab');
        cy.get('input[name="capacity"]').type('0');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('input[name="capacity"]')
          .parent()
          .should('contain', '0')
          .or.should('contain', 'greater')
          .or.should('contain', '>');
      });
    });

    describe('TC-G02-004: Tạo phòng với sức chứa âm', () => {
      it('should show validation error for negative capacity', () => {
        cy.get('[data-testid="add-room-btn"]').click();
        
        cy.get('input[name="roomCode"]').type('LAB-NEGATIVE');
        cy.get('input[name="name"]').type('Negative Capacity Lab');
        cy.get('input[name="capacity"]').type('-5');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('input[name="capacity"]')
          .parent()
          .should('contain', 'positive')
          .or.should('contain', '>');
      });
    });
  });

  describe('UC-21: View Lab Room Details (TC-G02-005)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
    });

    describe('TC-G02-005: Xem chi tiết phòng lab', () => {
      it('should display room details with workstations', () => {
        // Click on a room
        cy.get('[data-testid="room-item"], [class*="room-card"]').first().click();
        
        // Verify details displayed
        cy.get('[data-testid="room-code"]').should('be.visible');
        cy.get('[data-testid="room-name"]').should('be.visible');
        cy.get('[data-testid="room-capacity"]').should('be.visible');
        cy.get('[data-testid="workstation-list"]').should('be.visible');
      });

      it('should show workstation count', () => {
        cy.get('[data-testid="room-item"]').first().click();
        
        cy.get('[data-testid="workstation-count"]')
          .should('be.visible')
          .and('not.include.text', 'undefined');
      });
    });
  });

  describe('UC-22: Update Lab Room (TC-G02-006 → TC-G02-007)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
    });

    describe('TC-G02-006: Cập nhật thông tin phòng hợp lệ', () => {
      it('should update room information successfully', () => {
        // Click edit button
        cy.get('[data-testid="room-item"]').first().within(() => {
          cy.get('[data-testid="edit-btn"], button:contains("Edit"), button:contains("Sửa")').click();
        });
        
        // Update form
        cy.get('input[name="name"]').clear().type('Updated Lab Name');
        cy.get('textarea[name="description"]').clear().type('Updated description');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G02-007: Giảm sức chứa phòng xuống dưới số máy hiện có', () => {
      it('should show error when reducing capacity below workstation count', () => {
        // Select a room with workstations
        cy.get('[data-testid="room-item"]').first().click();
        cy.get('[data-testid="edit-btn"]').click();
        
        // Get current workstation count
        cy.get('[data-testid="workstation-count"]').invoke('text').then((count) => {
          const wsCount = parseInt(count, 10);
          
          // Try to set capacity lower
          cy.get('input[name="capacity"]').clear().type(String(wsCount - 1));
          
          cy.get('button[type="submit"]').click();
          
          cy.get('[data-testid="error-message"]')
            .should('contain', 'capacity')
            .or.should('contain', 'workstation');
        });
      });
    });
  });

  describe('UC-23: Delete Lab Room (TC-G02-008 → TC-G02-011)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
    });

    describe('TC-G02-008: Xóa phòng trống (không có máy, không có lịch đặt)', () => {
      it('should delete empty room successfully', () => {
        // Find an empty room (no workstations)
        cy.get('[data-testid="room-item"]').filter(':has([data-testid="workstation-count"]:contains("0"))').first()
          .within(() => {
            cy.get('[data-testid="delete-btn"], button:contains("Delete"), button:contains("Xóa")').click();
          });
        
        // Confirm deletion
        cy.get('[data-testid="confirm-delete"], button:contains("Confirm"), button:contains("Xác nhận")').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G02-009: Xóa phòng có máy trạm con', () => {
      it('should show error when deleting room with workstations', () => {
        // Find a room with workstations
        cy.get('[data-testid="room-item"]').filter(':has([data-testid="workstation-count"]:not(:contains("0")))').first()
          .within(() => {
            cy.get('[data-testid="delete-btn"]').click();
          });
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'workstation')
          .or.should('contain', 'máy');
      });
    });

    describe('TC-G02-010: Xóa phòng có lịch đặt đang active', () => {
      it('should show error when deleting room with active reservations', () => {
        cy.get('[data-testid="room-item"]').first()
          .within(() => {
            cy.get('[data-testid="delete-btn"]').click();
          });
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'reservation')
          .or.should('contain', 'lịch')
          .or.should('contain', 'booking');
      });
    });

    describe('TC-G02-011: Non-admin tạo/xóa phòng', () => {
      it('should deny access to non-admin users', () => {
        // Logout and login as customer
        cy.logout();
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
        
        cy.visit('/admin/lab-rooms');
        
        // Should redirect or show 403
        cy.url().should('not.include', '/admin/lab-rooms')
          .or.cy.get('body').should('contain', '403')
          .or.cy.get('body').should('contain', 'Forbidden');
      });
    });
  });

  describe('UC-24: Add Workstation (TC-G02-012 → TC-G02-016)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
      // Navigate to a room first
      cy.get('[data-testid="room-item"]').first().click();
      cy.get('[data-testid="workstations-tab"], tab:contains("Workstation")').click();
    });

    describe('TC-G02-012: Thêm máy trạm vào phòng hợp lệ', () => {
      it('should add workstation successfully', () => {
        const timestamp = Date.now();
        
        cy.get('[data-testid="add-workstation-btn"], button:contains("Add Workstation")').click();
        
        cy.get('input[name="stationCode"]').type(`WS-${timestamp}`);
        cy.get('input[name="ipAddress"]').type(`192.168.1.${timestamp % 255}`);
        cy.get('input[name="macAddress"]').type(`00:1A:2B:3C:4D:${String(timestamp % 255).padStart(2, '0')}`);
        cy.get('input[name="cpu"]').type('Intel Core i7');
        cy.get('input[name="ramGb"]').type('16');
        cy.get('input[name="os"]').type('Windows 11');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G02-013: Thêm máy vượt sức chứa phòng', () => {
      it('should show error when room is at capacity', () => {
        cy.get('[data-testid="add-workstation-btn"]').click();
        
        cy.get('input[name="stationCode"]').type('WS-OVER');
        cy.get('input[name="ramGb"]').type('8');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'capacity')
          .or.should('contain', 'full');
      });
    });

    describe('TC-G02-014: Thêm máy với IP address sai định dạng', () => {
      it('should show validation error for invalid IP', () => {
        cy.get('[data-testid="add-workstation-btn"]').click();
        
        cy.get('input[name="stationCode"]').type('WS-IP');
        cy.get('input[name="ipAddress"]').type('999.999.0.1');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('input[name="ipAddress"]')
          .parent()
          .should('contain', 'IP')
          .or.should('contain', 'invalid');
      });
    });

    describe('TC-G02-015: Thêm máy với MAC address sai định dạng', () => {
      it('should show validation error for invalid MAC', () => {
        cy.get('[data-testid="add-workstation-btn"]').click();
        
        cy.get('input[name="stationCode"]').type('WS-MAC');
        cy.get('input[name="macAddress"]').type('invalid-mac');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('input[name="macAddress"]')
          .parent()
          .should('contain', 'MAC')
          .or.should('contain', 'invalid');
      });
    });

    describe('TC-G02-016: Thêm máy với mã máy trùng trong cùng phòng', () => {
      it('should show error for duplicate station code', () => {
        cy.get('[data-testid="add-workstation-btn"]').click();
        
        // Use existing station code
        cy.get('[data-testid="existing-station-code"]').invoke('text').then((code) => {
          cy.get('input[name="stationCode"]').type(code);
          
          cy.get('button[type="submit"]').click();
          
          cy.get('[data-testid="error-message"]')
            .should('contain', 'already')
            .or.should('contain', 'trùng');
        });
      });
    });
  });

  describe('UC-25: View Workstation Specs (TC-G02-017)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
      cy.get('[data-testid="room-item"]').first().click();
      cy.get('[data-testid="workstations-tab"]').click();
    });

    describe('TC-G02-017: Xem thông số máy trạm', () => {
      it('should display all workstation specifications', () => {
        cy.get('[data-testid="workstation-item"]').first().click();
        
        cy.get('[data-testid="station-code"]').should('be.visible');
        cy.get('[data-testid="ip-address"]').should('be.visible');
        cy.get('[data-testid="mac-address"]').should('be.visible');
        cy.get('[data-testid="cpu-info"]').should('be.visible');
        cy.get('[data-testid="ram-info"]').should('be.visible');
        cy.get('[data-testid="gpu-info"]').should('be.visible');
        cy.get('[data-testid="os-info"]').should('be.visible');
      });
    });
  });

  describe('UC-26: Update Workstation (TC-G02-018)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
      cy.get('[data-testid="room-item"]').first().click();
      cy.get('[data-testid="workstations-tab"]').click();
    });

    describe('TC-G02-018: Cập nhật cấu hình máy hợp lệ', () => {
      it('should update workstation configuration', () => {
        cy.get('[data-testid="workstation-item"]').first()
          .within(() => {
            cy.get('[data-testid="edit-btn"]').click();
          });
        
        cy.get('input[name="cpu"]').clear().type('Intel Core i9');
        cy.get('input[name="ramGb"]').clear().type('32');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G02-019: Cập nhật RAM = 0 hoặc âm', () => {
      it('should show validation error for invalid RAM', () => {
        cy.get('[data-testid="workstation-item"]').first()
          .within(() => {
            cy.get('[data-testid="edit-btn"]').click();
          });
        
        cy.get('input[name="ramGb"]').clear().type('0');
        
        cy.get('button[type="submit"]').click();
        
        cy.get('input[name="ramGb"]')
          .parent()
          .should('contain', 'RAM')
          .or.should('contain', 'greater');
      });
    });
  });

  describe('UC-27: Remove Workstation (TC-G02-020 → TC-G02-021)', () => {
    beforeEach(() => {
      cy.visit('/admin/lab-rooms');
      cy.get('[data-testid="room-item"]').first().click();
      cy.get('[data-testid="workstations-tab"]').click();
    });

    describe('TC-G02-020: Xóa máy không có reservation', () => {
      it('should delete workstation without active reservations', () => {
        // Find workstation without reservations
        cy.get('[data-testid="workstation-item"]').filter(':has([data-testid="reservation-count"]:contains("0"))').first()
          .within(() => {
            cy.get('[data-testid="delete-btn"]').click();
          });
        
        cy.get('[data-testid="confirm-delete"]').click();
        
        cy.get('[data-testid="success-message"]').should('be.visible');
      });
    });

    describe('TC-G02-021: Xóa máy có reservation đang active', () => {
      it('should show error when deleting workstation with reservations', () => {
        cy.get('[data-testid="workstation-item"]').filter(':has([data-testid="reservation-count"]:not(:contains("0")))').first()
          .within(() => {
            cy.get('[data-testid="delete-btn"]').click();
          });
        
        cy.get('[data-testid="error-message"]')
          .should('contain', 'reservation')
          .or.should('contain', 'lịch');
      });
    });
  });

  describe('UC-19: Change Workstation State (TC-G02-022 → TC-G02-025)', () => {
    beforeEach(() => {
      // Login as staff for state changes
      cy.logout();
      cy.loginViaApi('staff@example.com', 'StaffPassword@123');
      
      cy.visit('/admin/lab-rooms');
      cy.get('[data-testid="room-item"]').first().click();
      cy.get('[data-testid="workstations-tab"]').click();
    });

    describe('TC-G02-022: Chuyển máy sang Maintenance', () => {
      it('should set workstation to maintenance state', () => {
        cy.get('[data-testid="workstation-item"]').first()
          .within(() => {
            cy.get('[data-testid="state-toggle"], button:contains("Maintenance")').click();
          });
        
        cy.get('[data-testid="workstation-item"]').first()
          .should('contain', 'Maintenance');
      });
    });

    describe('TC-G02-023: Chuyển máy từ Maintenance về Available', () => {
      it('should set workstation back to available', () => {
        cy.get('[data-testid="workstation-item"]')
          .filter(':has([class*="maintenance"])').first()
          .within(() => {
            cy.get('[data-testid="state-toggle"], button:contains("Available")').click();
          });
        
        cy.get('[data-testid="workstation-item"]')
          .filter(':has([class*="maintenance"])')
          .should('not.exist');
      });
    });

    describe('TC-G02-024: Customer cố đặt máy đang Maintenance', () => {
      it('should not allow booking maintenance workstation', () => {
        cy.logout();
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
        
        // Set a workstation to maintenance
        cy.visit('/admin/lab-rooms');
        cy.get('[data-testid="room-item"]').first().click();
        cy.get('[data-testid="workstations-tab"]').click();
        cy.get('[data-testid="workstation-item"]').first()
          .within(() => {
            cy.get('[data-testid="state-toggle"]').click();
          });
        
        // Try to book as customer
        cy.visit('/reservations/new');
        cy.get('[data-testid="workstation-selector"]').click();
        
        // Maintenance workstations should not be visible
        cy.get('[data-testid="maintenance-workstation"]').should('not.exist');
      });
    });

    describe('TC-G02-025: Non-staff cố thay đổi trạng thái máy', () => {
      it('should deny state change for non-staff users', () => {
        cy.logout();
        cy.loginViaApi('customer@example.com', 'CustomerPassword@123');
        
        cy.visit('/admin/lab-rooms');
        cy.get('[data-testid="room-item"]').first().click();
        cy.get('[data-testid="workstations-tab"]').click();
        
        // State toggle should not be visible
        cy.get('[data-testid="state-toggle"]').should('not.exist');
      });
    });
  });
});
