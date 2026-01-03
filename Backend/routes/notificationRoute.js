import express from "express";
import {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from "../controller/notificationController.js";

const router = express.Router();

router.get("/unread-count", getUnreadCount);
router.post("/mark-read", markAllNotificationsRead);
router.get("/", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markNotificationRead);

export default router;
