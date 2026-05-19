const reportService = require("../services/reportService");
const { ok } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const generateReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, labRoomId } = req.query;
  const report = await reportService.generate({
    startDate,
    endDate,
    labRoomId: labRoomId ? parseInt(labRoomId, 10) : null,
  });
  return ok(res, { data: report });
});

module.exports = { generateReport };
