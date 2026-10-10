import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import feeRoutes from "./routes/fee.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
if (env.nodeEnv === "development") app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Aponiq API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;