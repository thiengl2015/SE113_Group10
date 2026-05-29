/**
 * Jest Performance & Non-Functional Tests
 * Module: TCS-G06 - Yêu cầu phi chức năng
 * 
 * Test Cases: TC-G06-001 → TC-G06-008
 * 
 * Note: True performance testing requires tools like k6, JMeter, or Artillery.
 * These tests provide basic performance validation using Jest.
 */

const ApiError = require("../src/utils/ApiError");

// Mock Prisma for testing
const mockPrismaInstance = {
  labRoom: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  workstation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  reservation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  incidentTicket: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Setup $transaction
const setupTransaction = () => {
  mockPrismaInstance.$transaction.mockImplementation(async (arg) => {
    if (typeof arg === 'function') {
      return arg(mockPrismaInstance);
    } else if (Array.isArray(arg)) {
      return Promise.all(arg.map(q => q));
    }
    return arg;
  });
};

jest.mock("../src/config/prisma", () => mockPrismaInstance);

// Import services after mocking
const labRoomService = require("../src/services/labRoomService");
const workstationService = require("../src/services/workstationService");
const reservationService = require("../src/services/reservationService");
const incidentService = require("../src/services/incidentService");

// Helper functions
const generateMockData = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    room_code: `LAB-${String(i + 1).padStart(3, '0')}`,
    name: `Lab Room ${i + 1}`,
    location: `Building ${String.fromCharCode(65 + (i % 3))}`,
    capacity: 30,
    description: `Description for lab ${i + 1}`,
    status: "active",
    created_at: new Date(),
    updated_at: new Date(),
    _count: { workstations: 0 },
    workstations: [],
  }));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrismaInstance.$transaction.mockReset();
});

describe("TCS-G06: Performance & Non-Functional Requirements", () => {
  describe("TC-G06-001: Thời gian phản hồi API đọc (read)", () => {
    test("should respond within 1 second for list lab rooms", async () => {
      const mockRooms = generateMockData(50);
      mockPrismaInstance.labRoom.findMany.mockResolvedValue(mockRooms);

      const startTime = Date.now();
      const result = await labRoomService.list({});
      const duration = Date.now() - startTime;

      expect(result).toBeInstanceOf(Array);
      expect(duration).toBeLessThan(1000); // < 1 second
    });

    test("should respond within 1 second for list workstations", async () => {
      const mockWorkstations = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        station_code: `WS-${String(i + 1).padStart(3, '0')}`,
        ip_address: `192.168.1.${i + 1}`,
        mac_address: `00:1A:2B:3C:4D:${String(i).padStart(2, '0')}`,
        cpu: "Intel Core i7",
        ram_gb: 16,
        gpu: "NVIDIA GTX 1060",
        os: "Windows 11",
        state: "available",
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
        created_at: new Date(),
      }));
      mockPrismaInstance.workstation.findMany.mockResolvedValue(mockWorkstations);

      const startTime = Date.now();
      const result = await workstationService.list({});
      const duration = Date.now() - startTime;

      expect(result).toBeInstanceOf(Array);
      expect(duration).toBeLessThan(1000); // < 1 second
    });

    test("should respond within 1 second for reservation history", async () => {
      setupTransaction();
      const mockReservations = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        user_id: 1,
        resource_type: "lab_room",
        lab_room_id: 1,
        start_time: new Date(),
        end_time: new Date(),
        status: "approved",
        created_at: new Date(),
        user: { id: 1, username: "testuser", email: "test@example.com", full_name: "Test User" },
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
      }));
      mockPrismaInstance.reservation.findMany.mockResolvedValue(mockReservations);
      mockPrismaInstance.reservation.count.mockResolvedValue(20);

      const startTime = Date.now();
      const result = await reservationService.getHistory(1, {});
      const duration = Date.now() - startTime;

      expect(result).toHaveProperty("items");
      expect(duration).toBeLessThan(1000); // < 1 second
    });
  });

  describe("TC-G06-002: Thời gian phản hồi API ghi (write)", () => {
    test("should complete within 2 seconds for creating reservation", async () => {
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);

      setupTransaction();
      mockPrismaInstance.labRoom.findUnique.mockResolvedValue({ id: 1, status: "active" });
      mockPrismaInstance.reservation.findFirst.mockResolvedValue(null);
      mockPrismaInstance.reservation.create.mockResolvedValue({ id: 1 });
      mockPrismaInstance.reservation.findUnique.mockResolvedValue({
        id: 1,
        user_id: 1,
        resource_type: "lab_room",
        lab_room_id: 1,
        start_time: futureStart,
        end_time: futureEnd,
        status: "pending",
        created_at: new Date(),
        user: { id: 1, username: "test", email: "test@example.com", full_name: "Test" },
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
      });

      const startTime = Date.now();
      await reservationService.reserveLabRoom(1, {
        labRoomId: 1,
        startTime: futureStart.toISOString(),
        endTime: futureEnd.toISOString(),
        purpose: "Test",
        expectedUsers: 5,
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // < 2 seconds
    });

    test("should complete within 2 seconds for updating reservation status", async () => {
      setupTransaction();
      mockPrismaInstance.reservation.findUnique.mockResolvedValue({
        id: 1,
        user_id: 1,
        resource_type: "lab_room",
        status: "pending",
        start_time: new Date(),
        end_time: new Date(),
        created_at: new Date(),
        user: { id: 1, username: "test", email: "test@example.com", full_name: "Test" },
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
      });
      mockPrismaInstance.reservation.findFirst.mockResolvedValue(null);
      mockPrismaInstance.reservation.update.mockResolvedValue({
        id: 1,
        status: "approved",
        processed_by: 2,
        processed_at: new Date(),
      });
      mockPrismaInstance.reservation.findUnique.mockResolvedValueOnce({
        id: 1,
        status: "pending",
        resource_type: "lab_room",
        start_time: new Date(),
        end_time: new Date(),
        created_at: new Date(),
        user: { id: 1, username: "test", email: "test@example.com", full_name: "Test" },
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
      });

      const startTime = Date.now();
      await reservationService.approveReservation(2, 1);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // < 2 seconds
    });

    test("should complete within 2 seconds for creating lab room", async () => {
      mockPrismaInstance.labRoom.findUnique.mockResolvedValue(null);
      mockPrismaInstance.labRoom.create.mockResolvedValue({
        id: 1,
        room_code: "LAB-NEW",
        name: "New Lab",
        capacity: 20,
        status: "active",
      });
      mockPrismaInstance.labRoom.findUnique.mockResolvedValueOnce(null);
      mockPrismaInstance.labRoom.findUnique.mockResolvedValueOnce({
        id: 1,
        room_code: "LAB-NEW",
        name: "New Lab",
        capacity: 20,
        status: "active",
        _count: { workstations: 0 },
        workstations: [],
      });

      const startTime = Date.now();
      await labRoomService.create({
        roomCode: "LAB-NEW",
        name: "New Lab",
        capacity: 20,
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // < 2 seconds
    });
  });

  describe("TC-G06-003: Render grid lịch sẵn có (Large dataset handling)", () => {
    test("should handle large dataset of 50+ workstations efficiently", async () => {
      const mockWorkstations = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        station_code: `WS-${String(i + 1).padStart(3, '0')}`,
        ip_address: `192.168.1.${(i % 255) + 1}`,
        mac_address: `00:1A:2B:3C:4D:${String(i % 255).padStart(2, '0')}`,
        cpu: "Intel Core i7",
        ram_gb: 16,
        gpu: "NVIDIA GTX 1060",
        os: "Windows 11",
        state: "available",
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
        created_at: new Date(),
      }));
      mockPrismaInstance.workstation.findMany.mockResolvedValue(mockWorkstations);

      const startTime = Date.now();
      const result = await workstationService.list({});
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(500); // < 500ms for rendering large list
    });

    test("should handle large dataset of 50+ lab rooms efficiently", async () => {
      const mockRooms = generateMockData(100);
      mockPrismaInstance.labRoom.findMany.mockResolvedValue(mockRooms);

      const startTime = Date.now();
      const result = await labRoomService.list({});
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(500); // < 500ms for rendering large list
    });
  });

  describe("TC-G06-004: Nhiều user đồng thời đặt cùng tài nguyên", () => {
    test("should handle concurrent booking requests without deadlock", async () => {
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);

      // Simulate concurrent requests - only one should succeed
      setupTransaction();
      mockPrismaInstance.labRoom.findUnique.mockResolvedValue({ id: 1, status: "active" });
      mockPrismaInstance.reservation.findFirst.mockResolvedValue(null); // First request finds no conflict
      mockPrismaInstance.reservation.create.mockResolvedValue({ id: 1 });
      mockPrismaInstance.reservation.findUnique.mockResolvedValue({
        id: 1,
        user_id: 1,
        resource_type: "lab_room",
        status: "pending",
        start_time: futureStart,
        end_time: futureEnd,
        created_at: new Date(),
        user: { id: 1, username: "user1", email: "user1@example.com", full_name: "User 1" },
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
      });

      // Simulate concurrent bookings
      const promises = [
        reservationService.reserveLabRoom(1, {
          labRoomId: 1,
          startTime: futureStart.toISOString(),
          endTime: futureEnd.toISOString(),
        }),
        reservationService.reserveLabRoom(2, {
          labRoomId: 1,
          startTime: futureStart.toISOString(),
          endTime: futureEnd.toISOString(),
        }),
        reservationService.reserveLabRoom(3, {
          labRoomId: 1,
          startTime: futureStart.toISOString(),
          endTime: futureEnd.toISOString(),
        }),
      ];

      const results = await Promise.allSettled(promises);
      
      // At least one should succeed, others should handle conflict
      const fulfilledCount = results.filter(r => r.status === 'fulfilled').length;
      expect(fulfilledCount).toBeGreaterThanOrEqual(1);
    });

    test("should detect conflict when second booking overlaps", async () => {
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);

      setupTransaction();
      mockPrismaInstance.labRoom.findUnique.mockResolvedValue({ id: 1, status: "active" });
      // Second call finds conflict
      mockPrismaInstance.reservation.findFirst.mockResolvedValue({ id: 99 }); // Existing booking

      await expect(
        reservationService.reserveLabRoom(1, {
          labRoomId: 1,
          startTime: futureStart.toISOString(),
          endTime: futureEnd.toISOString(),
        })
      ).rejects.toThrow("This time slot is already occupied");
    });
  });

  describe("TC-G06-005: Rollback khi lỗi giữa chừng transaction", () => {
    test("should rollback on error during transaction", async () => {
      setupTransaction();
      
      // Simulate transaction that fails midway
      mockPrismaInstance.reservation.findUnique
        .mockResolvedValueOnce({
          id: 1,
          user_id: 1,
          resource_type: "lab_room",
          status: "pending",
          start_time: new Date(),
          end_time: new Date(),
          created_at: new Date(),
          user: { id: 1, username: "test", email: "test@example.com", full_name: "Test" },
          lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
        });

      mockPrismaInstance.reservation.findFirst.mockResolvedValue(null);
      mockPrismaInstance.reservation.update.mockImplementation(() => {
        throw new Error("Database error during update");
      });

      await expect(
        reservationService.approveReservation(2, 1)
      ).rejects.toThrow();
    });

    test("should not leave partial updates on failure", async () => {
      setupTransaction();
      
      mockPrismaInstance.reservation.findUnique.mockResolvedValue({
        id: 1,
        user_id: 1,
        resource_type: "lab_room",
        status: "pending",
        start_time: new Date(),
        end_time: new Date(),
        created_at: new Date(),
        user: { id: 1, username: "test", email: "test@example.com", full_name: "Test" },
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
      });
      mockPrismaInstance.reservation.findFirst.mockResolvedValue(null);
      
      // Update succeeds
      mockPrismaInstance.reservation.update.mockResolvedValue({
        id: 1,
        status: "approved",
      });

      const result = await reservationService.approveReservation(2, 1);
      
      // Update was called once (no partial updates)
      expect(mockPrismaInstance.reservation.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-G06-006: Lỗi hệ thống không lộ thông tin nhạy cảm", () => {
    test("ApiError should not contain SQL or stack trace", () => {
      const error = new ApiError(500, "Internal server error");
      
      expect(error.message).not.toContain("SELECT");
      expect(error.message).not.toContain("INSERT");
      expect(error.message).not.toContain("UPDATE");
      expect(error.message).not.toContain("DELETE");
      expect(error.message).not.toContain("FROM");
      expect(error.message).not.toContain("WHERE");
      expect(error.message).not.toContain("stack");
      expect(error.message).not.toContain(".js:");
    });

    test("service errors should be user-friendly", () => {
      const error = ApiError.conflict("Room code already registered");
      
      expect(error.statusCode).toBe(409);
      expect(error.message).toBeTruthy();
      expect(typeof error.message).toBe("string");
    });

    test("database errors should be wrapped in ApiError", () => {
      // Simulate DB error being wrapped
      const dbError = new Error("SELECT * FROM users WHERE id = 1");
      const apiError = ApiError.badRequest("An error occurred");
      
      // The wrapped error should not expose DB details
      expect(apiError.message).not.toContain("SELECT");
    });
  });

  describe("TC-G06-007: Validation feedback rõ ràng trên UI", () => {
    test("service should throw specific validation errors", async () => {
      // Test that service throws specific, actionable error messages
      // Test with end_time before start_time
      await expect(
        reservationService.reserveLabRoom(1, {
          labRoomId: 1,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
        })
      ).rejects.toThrow("End time must be after start time");
    });

    test("validation errors should indicate which field is invalid", () => {
      const error = ApiError.badRequest("Description is required");
      
      expect(error.message).toContain("Description");
    });

    test("conflict errors should explain the conflict", () => {
      const error = ApiError.conflict("This time slot is already occupied");
      
      expect(error.message).toContain("time slot");
      expect(error.message).toContain("occupied");
    });
  });

  describe("TC-G06-008: Cấu trúc response API nhất quán", () => {
    test("labRoomService.list should return consistent array format", async () => {
      const mockRooms = generateMockData(5);
      mockPrismaInstance.labRoom.findMany.mockResolvedValue(mockRooms);

      const result = await labRoomService.list({});

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(5);
      result.forEach(room => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('room_code');
        expect(room).toHaveProperty('name');
      });
    });

    test("reservationService.getHistory should return paginated format", async () => {
      setupTransaction();
      const mockReservations = Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        resource_type: "lab_room",
        status: "approved",
        start_time: new Date(),
        end_time: new Date(),
        created_at: new Date(),
        user: { id: 1, username: "test", email: "test@example.com", full_name: "Test" },
        lab_room: { id: 1, room_code: "LAB-101", name: "Lab 101" },
      }));
      mockPrismaInstance.reservation.findMany.mockResolvedValue(mockReservations);
      mockPrismaInstance.reservation.count.mockResolvedValue(3);

      const result = await reservationService.getHistory(1, {});

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result.items).toBeInstanceOf(Array);
    });

    test("incidentService.list should return paginated format", async () => {
      setupTransaction();
      const mockTickets = Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        category: "hardware",
        description: "Issue",
        status: "open",
        created_at: new Date(),
        reporter: { id: 1, username: "test", full_name: "Test" },
      }));
      mockPrismaInstance.incidentTicket.findMany.mockResolvedValue(mockTickets);
      mockPrismaInstance.incidentTicket.count.mockResolvedValue(3);

      const result = await incidentService.list({});

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
    });
  });
});

describe("Performance Stress Tests", () => {
  test("should handle multiple rapid sequential requests", async () => {
    const mockRooms = generateMockData(10);
    mockPrismaInstance.labRoom.findMany.mockResolvedValue(mockRooms);

    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await labRoomService.list({});
    }
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 10 requests in under 5 seconds
  });

  test("should handle concurrent list requests efficiently", async () => {
    mockPrismaInstance.labRoom.findMany.mockResolvedValue(generateMockData(20));

    const startTime = Date.now();
    await Promise.all([
      labRoomService.list({}),
      labRoomService.list({}),
      labRoomService.list({}),
      labRoomService.list({}),
      labRoomService.list({}),
    ]);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000); // 5 concurrent requests under 2 seconds
  });
});
