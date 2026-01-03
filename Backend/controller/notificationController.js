import Notification from "../models/notificationModel.js";

const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { recipientType, recipientId, isRead, limit = 20 } = req.query;
    const query = {};
    if (recipientType) {
      query.recipientType = recipientType;
    }
    if (recipientId) {
      query.recipient = recipientId;
    }
    if (typeof isRead !== "undefined") {
      query.isRead = isRead === "true";
    }
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notifikasi tidak ditemukan" });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.body;
    const query = {};
    if (recipientType) {
      query.recipientType = recipientType;
    }
    if (recipientId) {
      query.recipient = recipientId;
    }
    await Notification.updateMany(query, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.query;
    const query = { isRead: false };
    if (recipientType) {
      query.recipientType = recipientType;
    }
    if (recipientId) {
      query.recipient = recipientId;
    }
    const count = await Notification.countDocuments(query);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
};
