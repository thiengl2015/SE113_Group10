const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

const WORKSTATION_INCLUDE = {
  lab_room: { select: { id: true, room_code: true, name: true } },
};

const formatWorkstation = (w) => ({
  id: w.id,
  station_code: w.station_code,
  ip_address: w.ip_address,
  mac_address: w.mac_address,
  cpu: w.cpu,
  ram_gb: w.ram_gb,
  gpu: w.gpu,
  os: w.os,
  state: w.state,
  lab_room: w.lab_room || null,
  created_at: w.created_at,
});

const list = async ({
  labRoomId,
  state,
  search,
  date,
  startTime,
  endTime,
  minRam,
  cpu,
  os,
}) => {
  const labId = labRoomId ? parseInt(labRoomId, 10) : null;
  const where = {
    ...(labId ? { lab_room_id: labId } : {}),
    ...(state ? { state } : {}),
    ...(minRam ? { ram_gb: { gte: parseInt(minRam, 10) } } : {}),
    ...(cpu ? { cpu: { contains: cpu, mode: "insensitive" } } : {}),
    ...(os ? { os: { contains: os, mode: "insensitive" } } : {}),
  };

  if (search) {
    const like = search.trim();
    where.OR = [
      { station_code: { contains: like, mode: "insensitive" } },
      { ip_address: { contains: like, mode: "insensitive" } },
    ];
  }

  if (date && startTime && endTime) {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    where.reservations = {
      none: {
        resource_type: "workstation",
        status: "approved",
        workstation_id: { not: null },
        start_time: { lt: end },
        end_time: { gt: start },
      },
    };
  }

  const rows = await prisma.workstation.findMany({
    where,
    include: WORKSTATION_INCLUDE,
    orderBy: [{ lab_room: { name: "asc" } }, { station_code: "asc" }],
  });
  return rows.map(formatWorkstation);
};

const getById = async (id) => {
  const ws = await prisma.workstation.findUnique({
    where: { id },
    include: WORKSTATION_INCLUDE,
  });
  if (!ws) throw ApiError.notFound("Workstation not found");
  return formatWorkstation(ws);
};

const create = async ({
  labRoomId,
  stationCode,
  ipAddress,
  macAddress,
  cpu,
  ramGb,
  gpu,
  os,
}) => {
  const room = await prisma.labRoom.findUnique({
    where: { id: labRoomId },
    select: { capacity: true },
  });
  if (!room) throw ApiError.notFound("Lab room not found");

  const count = await prisma.workstation.count({
    where: { lab_room_id: labRoomId },
  });
  if (count >= room.capacity) {
    throw ApiError.conflict("Target room has reached its maximum capacity");
  }

  const created = await prisma.workstation.create({
    data: {
      lab_room_id: labRoomId,
      station_code: stationCode,
      ip_address: ipAddress || "",
      mac_address: macAddress || "",
      cpu: cpu || "",
      ram_gb: parseInt(ramGb, 10) || 0,
      gpu: gpu || "",
      os: os || "",
    },
  });
  return getById(created.id);
};

const update = async (
  id,
  { stationCode, ipAddress, macAddress, cpu, ramGb, gpu, os },
) => {
  await getById(id);
  await prisma.workstation.update({
    where: { id },
    data: {
      station_code: stationCode ?? undefined,
      ip_address: ipAddress ?? undefined,
      mac_address: macAddress ?? undefined,
      cpu: cpu ?? undefined,
      ram_gb: ramGb !== undefined ? parseInt(ramGb, 10) : undefined,
      gpu: gpu ?? undefined,
      os: os ?? undefined,
    },
  });
  return getById(id);
};

const setState = async (id, newState) => {
  const ws = await getById(id);

  if (newState === "maintenance") {
    const booking = await prisma.reservation.findFirst({
      where: {
        workstation_id: id,
        status: "approved",
        end_time: { gt: new Date() },
      },
      select: { id: true },
    });
    if (booking) {
      return { warning: true, workstation: ws };
    }
  }

  await prisma.workstation.update({
    where: { id },
    data: { state: newState },
  });
  return { warning: false, workstation: await getById(id) };
};

const forceSetState = async (id, newState) => {
  await prisma.reservation.updateMany({
    where: {
      workstation_id: id,
      status: "approved",
      end_time: { gt: new Date() },
    },
    data: { status: "cancelled" },
  });
  await prisma.workstation.update({
    where: { id },
    data: { state: newState },
  });
  return getById(id);
};

const remove = async (id) => {
  const activeBookings = await prisma.reservation.count({
    where: {
      workstation_id: id,
      status: { in: ["pending", "approved"] },
      end_time: { gt: new Date() },
    },
  });
  if (activeBookings > 0) {
    throw ApiError.conflict(
      "Cannot delete workstation with active or upcoming reservations.",
    );
  }
  await prisma.workstation.delete({ where: { id } });
};

module.exports = {
  list,
  getById,
  create,
  update,
  setState,
  forceSetState,
  remove,
};
