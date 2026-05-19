const reservationService = require("../services/reservationService");
const ApiError = require("../utils/ApiError");
const { ok } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const reserveLabRoom = asyncHandler(async (req, res) => {
  const { labRoomId, startTime, endTime, purpose, expectedUsers } = req.body;
  const reservation = await reservationService.reserveLabRoom(req.user.id, {
    labRoomId: parseInt(labRoomId, 10),
    startTime,
    endTime,
    purpose,
    expectedUsers,
  });
  return ok(res, {
    statusCode: 201,
    message: "Reservation created",
    data: reservation,
  });
});

const reserveWorkstation = asyncHandler(async (req, res) => {
  const { workstationId, startTime, endTime } = req.body;
  const reservation = await reservationService.reserveWorkstation(req.user.id, {
    workstationId: parseInt(workstationId, 10),
    startTime,
    endTime,
  });
  return ok(res, {
    statusCode: 201,
    message: "Reservation created",
    data: reservation,
  });
});

const getMyReservations = asyncHandler(async (req, res) => {
  const { status, page, pageSize } = req.query;
  const result = await reservationService.getHistory(req.user.id, {
    status,
    page,
    pageSize,
  });
  return ok(res, {
    data: result.items,
    metadata: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    },
  });
});

const cancelReservation = asyncHandler(async (req, res) => {
  await reservationService.cancelReservation(
    req.user.id,
    parseInt(req.params.id, 10),
  );
  return ok(res, { message: "Reservation cancelled successfully." });
});

const getPendingQueue = asyncHandler(async (req, res) => {
  const { page, pageSize } = req.query;
  const result = await reservationService.getPendingQueue({ page, pageSize });
  return ok(res, {
    data: result.items,
    metadata: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    },
  });
});

const approveReservation = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await reservationService.approveReservation(req.user.id, id);
  const reservation = await reservationService.getById(id);
  return ok(res, { message: "Reservation approved", data: reservation });
});

const rejectReservation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const id = parseInt(req.params.id, 10);
  await reservationService.rejectReservation(req.user.id, id, reason);
  const reservation = await reservationService.getById(id);
  return ok(res, { message: "Reservation rejected", data: reservation });
});

const getReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.getById(
    parseInt(req.params.id, 10),
  );
  if (req.user.role === "customer" && reservation.user?.id !== req.user.id) {
    throw ApiError.forbidden("Access denied");
  }
  return ok(res, { data: reservation });
});

module.exports = {
  reserveLabRoom,
  reserveWorkstation,
  getMyReservations,
  cancelReservation,
  getPendingQueue,
  approveReservation,
  rejectReservation,
  getReservation,
};
