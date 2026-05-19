require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");

const { initializeDatabase } = require("./config/bootstrap");
const errorHandler = require("./middlewares/errorHandler");
const { apiLimiter } = require("./middlewares/rateLimit");

const PORT = parseInt(process.env.PORT, 10) || 5000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const labRoomRoutes = require("./routes/labRoomRoutes");
const workstationRoutes = require("./routes/workstationRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openapi = yaml.load(path.resolve(__dirname, "..", "openapi.yaml"));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: "CLMS API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);
app.get("/api/openapi.json", (_req, res) => res.json(openapi));

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/lab-rooms", labRoomRoutes);
app.use("/api/workstations", workstationRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.use(errorHandler);

(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`[CLMS] Server running on http://localhost:${PORT}`);
      console.log(`[CLMS] Swagger UI: http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    console.error("[CLMS] Failed to start:", err);
    process.exit(1);
  }
})();

module.exports = app;
