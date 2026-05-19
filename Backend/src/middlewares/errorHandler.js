const { fail } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  if (Array.isArray(err?.errors) && err?.statusCode === 422) {
    return fail(res, 422, "Validation failed", err.errors);
  }

  if (err?.isApiError) {
    return fail(res, err.statusCode, err.message, err.details);
  }

  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    return fail(res, 401, "Invalid or expired token");
  }

  if (err?.code === "P2002" || err?.code === "23505") {
    return fail(res, 409, "Duplicated value");
  }

  if (err?.code === "23P01" || err?.meta?.code === "23P01") {
    return fail(res, 409, "Time slot is already booked");
  }

  console.error("[Unhandled error]", err);
  return fail(res, 500, "Internal server error", err.message);
};

module.exports = errorHandler;
