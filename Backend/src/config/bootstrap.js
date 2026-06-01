const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const SCHEMA_PATH = path.resolve(__dirname, "..", "..", "sql", "schema.sql");
const SEED_PATH = path.resolve(__dirname, "..", "..", "sql", "seed.sql");

const initializeDatabase = async () => {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
  const dbUser = process.env.DB_USER || "clms";
  const dbPassword = process.env.DB_PASSWORD || "clms_dev";
  const dbName = process.env.DB_NAME || "clms_db";
  const conn = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    multipleStatements: true,
  });

  const seed = fs.readFileSync(SEED_PATH, "utf8");
  try {
    await conn.query(schema);
    const [rows] = await conn.query("SELECT COUNT(*) AS count FROM users");
    const hasData = Array.isArray(rows) && rows[0] && rows[0].count > 0;
    if (hasData) {
      console.log("[bootstrap] Seed skipped (users already exist).");
      return;
    }
    await conn.query(seed);
    console.log("[bootstrap] Seed complete.");
  } finally {
    await conn.end();
  }
};

module.exports = { initializeDatabase };
