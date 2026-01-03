import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Task from "../models/taskModel.js";
import laporanModel from "../models/laporanModel.js";
import Petugas from "../models/petugasModel.js";
import Notification from "../models/notificationModel.js";

const genAIKey = process.env.GOOGLE_API_KEY;
const genAI = genAIKey ? new GoogleGenerativeAI(genAIKey) : null;

const statusMap = {
  belum: "Belum dikerjakan",
  sedang: "Sedang dikerjakan",
  selesai: "Selesai",
};

const generateTaskNumber = async () => {
  let code = "";
  let exists = true;
  while (exists) {
    code = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await Task.exists({ taskNumber: code });
  }
  return code;
};

const predictPriority = async (description, fallback = "sedang") => {
  if (!genAI || !description) {
    return fallback;
  }
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
    const prompt = `Tentukan prioritas laporan berikut menggunakan kata kunci di dalamnya. Pilih hanya salah satu dari: tinggi, sedang, rendah. Berikan hasil dalam format {"priority":"..."}. Deskripsi: "${description}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);
    const value = parsed.priority?.toLowerCase();
    if (["tinggi", "sedang", "rendah"].includes(value)) {
      return value;
    }
    return fallback;
  } catch (error) {
    return fallback;
  }
};

const findLaporanByIdentifier = async (identifier) => {
  if (!identifier) {
    return null;
  }
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const laporan = await laporanModel.findById(identifier);
    if (laporan) {
      return laporan;
    }
  }
  return laporanModel.findOne({ nomor_laporan: identifier });
};

const buildTaskStats = async () => {
  const [total, belum, sedang, selesai, tinggi, sedangPriority, rendah] =
    await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: "belum" }),
      Task.countDocuments({ status: "sedang" }),
      Task.countDocuments({ status: "selesai" }),
      Task.countDocuments({ priority: "tinggi" }),
      Task.countDocuments({ priority: "sedang" }),
      Task.countDocuments({ priority: "rendah" }),
    ]);
  return {
    total,
    status: { belum, sedang, selesai },
    priority: { tinggi, sedang: sedangPriority, rendah },
  };
};

const adjustPetugasLoad = async (petugasId, delta) => {
  if (!petugasId) {
    return;
  }
  const petugas = await Petugas.findById(petugasId);
  if (!petugas) {
    return;
  }
  petugas.currentLoad = Math.max(0, (petugas.currentLoad || 0) + delta);
  await petugas.save();
};

const createTask = async (req, res) => {
  try {
    const { reportId, assigneeId, priority, dueDate, notes, sendNotification } =
      req.body;
    if (!reportId || !assigneeId) {
      return res
        .status(400)
        .json({ success: false, message: "Laporan dan petugas wajib diisi" });
    }
    const laporan = await findLaporanByIdentifier(reportId);
    if (!laporan) {
      return res
        .status(404)
        .json({ success: false, message: "Laporan tidak ditemukan" });
    }
    const petugas = await Petugas.findById(assigneeId);
    if (!petugas) {
      return res
        .status(404)
        .json({ success: false, message: "Petugas tidak ditemukan" });
    }
    const taskNumber = await generateTaskNumber();
    const resolvedPriority =
      priority || (await predictPriority(laporan.deskripsi, "sedang"));
    const task = await Task.create({
      taskNumber,
      laporan: laporan._id,
      title: laporan.judul,
      description: laporan.deskripsi,
      priority: resolvedPriority,
      status: "belum",
      assignedTo: petugas._id,
      assignedBy: req.admin?.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
      history: [
        {
          action: "assign",
          description: `Ditugaskan ke ${petugas.name}`,
          actor: req.admin?.name || "Admin",
          createdAt: new Date(),
        },
      ],
    });
    laporan.status_laporan = statusMap.sedang;
    await laporan.save();
    await adjustPetugasLoad(petugas._id, 1);
    if (sendNotification !== false) {
      await Notification.create({
        title: `${laporan.nomor_laporan || task.taskNumber}`,
        message: `${laporan.judul} ditugaskan kepada Anda`,
        notificationType: "task",
        recipientType: "petugas",
        recipient: petugas._id,
        task: task._id,
        laporan: laporan._id,
      });
    }
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo")
      .populate({
        path: "laporan",
        select: "nomor_laporan judul deskripsi kategori status_laporan createdAt lokasi gambar",
      });
    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const { search, priority, status, assigneeId, page = 1, limit = 20 } =
      req.query;
    const query = {};
    if (priority) {
      query.priority = priority;
    }
    if (status) {
      query.status = status;
    }
    if (assigneeId) {
      query.assignedTo = assigneeId;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { taskNumber: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const tasks = await Task.find(query)
      .populate("assignedTo")
      .populate({
        path: "laporan",
        select: "nomor_laporan judul deskripsi kategori status_laporan createdAt lokasi gambar",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));
    const total = await Task.countDocuments(query);
    const stats = await buildTaskStats();
    res.json({
      success: true,
      data: tasks,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskDetail = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo")
      .populate({
        path: "laporan",
        select: "nomor_laporan judul deskripsi kategori status_laporan createdAt lokasi gambar",
      });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tugas tidak ditemukan" });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tugas tidak ditemukan" });
    }
    const {
      title,
      description,
      priority,
      status,
      assigneeId,
      dueDate,
      notes,
      sendNotification,
    } = req.body;
    const historyNotes = [];
    if (title && title !== task.title) {
      historyNotes.push("Judul diperbarui");
      task.title = title;
    }
    if (description && description !== task.description) {
      historyNotes.push("Deskripsi diperbarui");
      task.description = description;
    }
    if (priority && priority !== task.priority) {
      historyNotes.push(`Prioritas menjadi ${priority}`);
      task.priority = priority;
    }
    if (typeof notes !== "undefined") {
      task.notes = notes;
    }
    if (typeof dueDate !== "undefined") {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (status && status !== task.status) {
      historyNotes.push(`Status menjadi ${status}`);
      task.status = status;
      const updateStatus = statusMap[status] || statusMap.belum;
      await laporanModel.findByIdAndUpdate(task.laporan, {
        status_laporan: updateStatus,
      });
    }
    if (assigneeId && assigneeId !== String(task.assignedTo)) {
      const petugasBaru = await Petugas.findById(assigneeId);
      if (!petugasBaru) {
        return res
          .status(404)
          .json({ success: false, message: "Petugas tidak ditemukan" });
      }
      await adjustPetugasLoad(task.assignedTo, -1);
      task.assignedTo = petugasBaru._id;
      await adjustPetugasLoad(petugasBaru._id, 1);
      historyNotes.push(`Dialihkan ke ${petugasBaru.name}`);
    }
    if (historyNotes.length) {
      task.history.push({
        action: "update",
        description: historyNotes.join(", "),
        actor: req.admin?.name || "Admin",
        createdAt: new Date(),
      });
    }
    await task.save();
    if (sendNotification) {
      await Notification.create({
        title: task.taskNumber,
        message: `${task.title} diperbarui`,
        notificationType: "task",
        recipientType: "petugas",
        recipient: task.assignedTo,
        task: task._id,
        laporan: task.laporan,
      });
    }
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo")
      .populate({
        path: "laporan",
        select: "nomor_laporan judul deskripsi kategori status_laporan createdAt lokasi gambar",
      });
    res.json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tugas tidak ditemukan" });
    }
    await adjustPetugasLoad(task.assignedTo, -1);
    const remaining = await Task.countDocuments({ laporan: task.laporan });
    if (remaining === 0) {
      await laporanModel.findByIdAndUpdate(task.laporan, {
        status_laporan: statusMap.belum,
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTaskPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    if (!priority) {
      return res
        .status(400)
        .json({ success: false, message: "Prioritas wajib diisi" });
    }
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true }
    )
      .populate("assignedTo")
      .populate({
        path: "laporan",
        select: "nomor_laporan judul deskripsi kategori status_laporan createdAt lokasi gambar",
      });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tugas tidak ditemukan" });
    }
    task.history.push({
      action: "update",
      description: `Prioritas menjadi ${priority}`,
      actor: req.admin?.name || "Admin",
      createdAt: new Date(),
    });
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskStats = async (req, res) => {
  try {
    const stats = await buildTaskStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createTask,
  getTasks,
  getTaskDetail,
  updateTask,
  deleteTask,
  updateTaskPriority,
  getTaskStats,
};
