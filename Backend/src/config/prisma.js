const { PrismaClient } = require("@prisma/client");

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = encodeURIComponent(process.env.DB_USER || "");
  const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
  const auth = user ? (pass ? `${user}:${pass}` : user) : "";
  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const db = process.env.DB_NAME || "clms_db";

  const authPart = auth ? `${auth}@` : "";
  return `mysql://${authPart}${host}:${port}/${db}`;
};

process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient();

module.exports = prisma;
