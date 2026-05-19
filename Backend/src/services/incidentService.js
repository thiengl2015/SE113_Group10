const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

const VALID_STATUSES = ["open", "under_review", "resolved", "closed"];

const TICKET_INCLUDE = {
  reporter: { select: { id: true, username: true, full_name: true } },
  assigned_user: { select: { id: true, username: true, full_name: true } },
  workstation: {
    select: {
      id: true,
      station_code: true,
      lab_room: { select: { id: true, room_code: true, name: true } },
    },
  },
  lab_room: { select: { id: true, room_code: true, name: true } },
};

const formatTicket = (t) => ({
  id: t.id,
  category: t.category,
  description: t.description,
  status: t.status,
  reporter: t.reporter || null,
  assigned_user: t.assigned_user || null,
  workstation: t.workstation || null,
  lab_room: t.lab_room || null,
  resolution_note: t.resolution_note,
  created_at: t.created_at,
  resolved_at: t.resolved_at,
});

const create = async (
  reporterId,
  { workstationId, labRoomId, category, description },
) => {
  if (!description || !description.trim()) {
    throw ApiError.badRequest("Description is required");
  }

  const created = await prisma.incidentTicket.create({
    data: {
      reporter_id: reporterId,
      workstation_id: workstationId || null,
      lab_room_id: labRoomId || null,
      category,
      description: description.trim(),
      status: "open",
    },
  });
  return getById(created.id);
};

const list = async ({
  status,
  category,
  workstationId,
  labRoomId,
  page = 1,
  pageSize = 20,
}) => {
  const wsId = workstationId ? parseInt(workstationId, 10) : null;
  const roomId = labRoomId ? parseInt(labRoomId, 10) : null;
  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(wsId ? { workstation_id: wsId } : {}),
    ...(roomId ? { lab_room_id: roomId } : {}),
  };

  const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const [items, total] = await prisma.$transaction([
    prisma.incidentTicket.findMany({
      where,
      include: TICKET_INCLUDE,
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.incidentTicket.count({ where }),
  ]);

  return {
    items: items.map(formatTicket),
    total,
    page: Number(page),
    pageSize: limit,
  };
};

const getById = async (id) => {
  const ticket = await prisma.incidentTicket.findUnique({
    where: { id },
    include: TICKET_INCLUDE,
  });
  if (!ticket) throw ApiError.notFound("Incident ticket not found");
  return formatTicket(ticket);
};

const updateStatus = async (staffId, ticketId, { status, resolutionNote }) => {
  if (!VALID_STATUSES.includes(status)) {
    throw ApiError.badRequest(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    );
  }

  const ticket = await prisma.incidentTicket.findUnique({
    where: { id: ticketId },
    select: { status: true },
  });
  if (!ticket) throw ApiError.notFound("Incident ticket not found");
  if (ticket.status === "closed") {
    throw ApiError.conflict("Cannot update a closed ticket");
  }

  const resolvedAt = status === "resolved" ? new Date() : null;

  await prisma.incidentTicket.update({
    where: { id: ticketId },
    data: {
      status,
      resolution_note: resolutionNote ?? undefined,
      assigned_to: staffId || undefined,
      resolved_at: resolvedAt || undefined,
    },
  });
  return getById(ticketId);
};

module.exports = { create, list, getById, updateStatus };
