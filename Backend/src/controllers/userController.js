const userService = require("../services/userService");
const { ok } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.id);
  return ok(res, { data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  const user = await userService.updateProfile(req.user.id, {
    fullName,
    phone,
  });
  return ok(res, { message: "Profile updated", data: user });
});

const listUsers = asyncHandler(async (req, res) => {
  const { search, status, role, page, pageSize } = req.query;
  const result = await userService.list({
    search,
    status,
    role,
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

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getById(parseInt(req.params.id, 10));
  return ok(res, { data: user });
});

const blockUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  await userService.block(parseInt(req.params.id, 10), req.user.id, reason);
  return ok(res, { message: "User blocked successfully." });
});

const unblockUser = asyncHandler(async (req, res) => {
  await userService.unblock(parseInt(req.params.id, 10));
  return ok(res, { message: "User unblocked successfully." });
});

module.exports = {
  getMe,
  updateProfile,
  listUsers,
  getUserById,
  blockUser,
  unblockUser,
};
