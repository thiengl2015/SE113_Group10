const ok = (res, { data, message = "OK", statusCode = 200, metadata } = {}) => {
  const body = { statusCode, message };
  if (data !== undefined && data !== null) body.data = data;
  if (metadata !== undefined) body.metadata = metadata;
  return res.status(statusCode).json(body);
};

const fail = (res, statusCode, message, details) => {
  const body = { statusCode, message };
  if (details !== undefined) body.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { ok, fail };
