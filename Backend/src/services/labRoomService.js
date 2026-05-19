const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

const formatLabRoom = (r) => ({
  id: r.id,
  room_code: r.room_code,
  name: r.name,
  location: r.location,
  capacity: r.capacity,
  description: r.description,
  status: r.status,
  workstation_count: r._count?.workstations ?? 0,
  workstations: r.workstations,
  created_at: r.created_at,
});

const list = async ({
  search,
  status,
  date,
  startTime,
  endTime,
  minCapacity,
}) => {
  const where = {
    ...(status
      ? { status }
      : {
          status: { not: "decommissioned" },
        }),
    ...(minCapacity ? { capacity: { gte: parseInt(minCapacity, 10) } } : {}),
  };

  if (search) {
    const like = search.trim();
    where.OR = [
      { room_code: { contains: like, mode: "insensitive" } },
      { name: { contains: like, mode: "insensitive" } },
      { location: { contains: like, mode: "insensitive" } },
    ];
  }

  if (date && startTime && endTime) {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    where.reservations = {
      none: {
        resource_type: "lab_room",
        status: "approved",
        lab_room_id: { not: null },
        start_time: { lt: end },
        end_time: { gt: start },
      },
    };
  }

  const rows = await prisma.labRoom.findMany({
    where,
    include: { _count: { select: { workstations: true } } },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => {
    const formatted = formatLabRoom(r);
    delete formatted.workstations;
    return formatted;
  });
};

const getById = async (id) => {
  const room = await prisma.labRoom.findUnique({
    where: { id },
    include: {
      _count: { select: { workstations: true } },
      workstations: {
        select: {
          id: true,
          station_code: true,
          ip_address: true,
          mac_address: true,
          cpu: true,
          ram_gb: true,
          gpu: true,
          os: true,
          state: true,
        },
        orderBy: { station_code: "asc" },
      },
    },
  });
  if (!room) throw ApiError.notFound("Lab room not found");
  return formatLabRoom(room);
};

const create = async ({ roomCode, name, location, capacity, description }) => {
  const existing = await prisma.labRoom.findUnique({
    where: { room_code: roomCode },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict("Room code already registered");

  const created = await prisma.labRoom.create({
    data: {
      room_code: roomCode,
      name,
      location: location || "",
      capacity: parseInt(capacity, 10),
      description: description || null,
    },
  });
  return getById(created.id);
};

const update = async (
  id,
  { name, location, capacity, description, status },
) => {
  const room = await getById(id);

  if (capacity !== undefined) {
    const cap = parseInt(capacity, 10);
    if (cap < room.workstation_count) {
      throw ApiError.badRequest(
        `Capacity cannot be less than current workstation count (${room.workstation_count})`,
      );
    }
  }

  await prisma.labRoom.update({
    where: { id },
    data: {
      name: name ?? undefined,
      location: location ?? undefined,
      capacity: capacity !== undefined ? parseInt(capacity, 10) : undefined,
      description: description ?? undefined,
      status: status ?? undefined,
    },
  });
  return getById(id);
};

const remove = async (id) => {
  const wsCount = await prisma.workstation.count({
    where: { lab_room_id: id },
  });
  if (wsCount > 0) {
    throw ApiError.conflict(
      "Cannot delete room while workstations are registered. Remove workstations first.",
    );
  }

  const bookingCount = await prisma.reservation.count({
    where: {
      lab_room_id: id,
      status: { in: ["pending", "approved"] },
      end_time: { gt: new Date() },
    },
  });
  if (bookingCount > 0) {
    throw ApiError.conflict(
      "Cannot delete room with active or upcoming reservations. Cancel them first.",
    );
  }

  await prisma.labRoom.delete({ where: { id } });
};

module.exports = { list, getById, create, update, remove };
