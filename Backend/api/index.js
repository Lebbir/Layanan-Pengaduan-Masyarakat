// api/index.js - Vercel Serverless Function Entry Point
import express from "express";
import cors from "cors";
import "dotenv/config";

import { connectDB } from "../config/db.js";
import wargaRouter from "../routes/wargaRoute.js";
import laporanRouter from "../routes/laporanRoute.js";
import adminRouter from "../routes/adminRoute.js";
import petugasRouter from "../routes/petugasRoute.js";
import notificationRouter from "../routes/notificationRoute.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection with caching for serverless
let isConnected = false;

async function ensureDbConnection() {
  if (isConnected) {
    return;
  }
  await connectDB();
  isConnected = true;
}

// API Routes
app.use("/api/warga", wargaRouter);
app.use("/api/laporan", laporanRouter);
app.use("/api/admin", adminRouter);
app.use("/api/petugas", petugasRouter);
app.use("/api/notifications", notificationRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Layanan Pengaduan Masyarakat - Serverless Mode",
    version: "1.0.0",
    endpoints: {
      warga: "/api/warga",
      laporan: "/api/laporan",
      admin: "/api/admin",
      petugas: "/api/petugas",
      notifications: "/api/notifications",
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route tidak ditemukan",
  });
});

// Export handler for Vercel
export default async (req, res) => {
  try {
    await ensureDbConnection();
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
