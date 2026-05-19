const workstationService = require("../services/workstationService");
const { ok } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const listWorkstations = asyncHandler(async (req, res) => {
  const {
    labRoomId,
    state,
    search,
    date,
    startTime,
    endTime,
    minRam,
    cpu,
    os,
  } = req.query;
  const items = await workstationService.list({
    labRoomId,
    state,
    search,
    date,
    startTime,
    endTime,
    minRam,
    cpu,
    os,
  });
  return ok(res, { data: items });
});

const getWorkstation = asyncHandler(async (req, res) => {
  const ws = await workstationService.getById(parseInt(req.params.id, 10));
  return ok(res, { data: ws });
});

const createWorkstation = asyncHandler(async (req, res) => {
  const { labRoomId, stationCode, ipAddress, macAddress, cpu, ramGb, gpu, os } =
    req.body;
  const ws = await workstationService.create({
    labRoomId: parseInt(labRoomId, 10),
    stationCode,
    ipAddress,
    macAddress,
    cpu,
    ramGb: parseInt(ramGb, 10),
    gpu,
    os,
  });
  return ok(res, {
    statusCode: 201,
    message: "Workstation created",
    data: ws,
  });
});

const updateWorkstation = asyncHandler(async (req, res) => {
  const { stationCode, ipAddress, macAddress, cpu, ramGb, gpu, os } = req.body;
  const ws = await workstationService.update(parseInt(req.params.id, 10), {
    stationCode,
    ipAddress,
    macAddress,
    cpu,
    ramGb,
    gpu,
    os,
  });
  return ok(res, { message: "Workstation updated", data: ws });
});

const setWorkstationState = asyncHandler(async (req, res) => {
  const { state, force } = req.body;
  const id = parseInt(req.params.id, 10);

  if (force) {
    const ws = await workstationService.forceSetState(id, state);
    return ok(res, { message: "Workstation state updated (forced)", data: ws });
  }

  const result = await workstationService.setState(id, state, req.user.id);
  if (result.warning) {
    return ok(res, {
      message:
        "This workstation has upcoming approved bookings. Send force=true to override.",
      data: result.workstation,
    });
  }
  return ok(res, {
    message: "Workstation state updated",
    data: result.workstation,
  });
});

const deleteWorkstation = asyncHandler(async (req, res) => {
  await workstationService.remove(parseInt(req.params.id, 10));
  return ok(res, { message: "Workstation removed successfully." });
});

module.exports = {
  listWorkstations,
  getWorkstation,
  createWorkstation,
  updateWorkstation,
  setWorkstationState,
  deleteWorkstation,
};
