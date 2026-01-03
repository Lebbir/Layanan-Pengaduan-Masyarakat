import express from "express";
import {
  createTask,
  getTasks,
  getTaskDetail,
  updateTask,
  deleteTask,
  updateTaskPriority,
  getTaskStats,
} from "../controller/taskController.js";

const router = express.Router();

router.get("/", getTasks);
router.get("/stats", getTaskStats);
router.get("/:id", getTaskDetail);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id/priority", updateTaskPriority);
router.delete("/:id", deleteTask);

export default router;
