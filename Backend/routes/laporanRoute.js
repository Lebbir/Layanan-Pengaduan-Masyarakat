import express from "express";
import {
  createLaporan,
  getPublicLaporan,
  getPublicLaporanById,
  getAllLaporan,
  getLaporanById,
  updateStatusLaporan,
  getStatistics,
} from "../controller/laporanController.js";
import multer from "multer";
import authAdmin from "../middleware/authAdmin.js";

const laporanRouter = express.Router();

// File filter untuk validasi tipe file (gambar)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} tidak didukung. Hanya PNG, JPG, GIF, atau WEBP.`
      ),
      false
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

// Membuat laporan baru - menerima image (`upload_foto`)
laporanRouter.post("/buatlaporan", upload.single("upload_foto"), createLaporan);

// Public routes (for transparent public view)
laporanRouter.get("/public", getPublicLaporan);
laporanRouter.get("/public/:id", getPublicLaporanById);

// Admin routes (protected - only administrator can access)
laporanRouter.get("/all", authAdmin, getAllLaporan);
laporanRouter.get("/statistics", authAdmin, getStatistics);
laporanRouter.get("/:id", authAdmin, getLaporanById);
laporanRouter.put("/:id/status", authAdmin, updateStatusLaporan);

export default laporanRouter;
