import express from "express";
import {
  createPetugas,
  getPetugas,
  updatePetugas,
  togglePetugasStatus,
} from "../controller/petugasController.js";

const router = express.Router();

router.get("/", getPetugas);
router.post("/", createPetugas);
router.put("/:id", updatePetugas);
router.patch("/:id/status", togglePetugasStatus);

export default router;
