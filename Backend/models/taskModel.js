import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    action: { type: String, trim: true },
    description: { type: String, trim: true },
    actor: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    taskNumber: { type: String, unique: true },
    laporan: { type: mongoose.Schema.Types.ObjectId, ref: "laporan", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["tinggi", "sedang", "rendah"], default: "sedang" },
    status: { type: String, enum: ["belum", "sedang", "selesai"], default: "belum" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "petugas", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
    dueDate: { type: Date },
    notes: { type: String, trim: true },
    attachments: { type: [String], default: [] },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("task", taskSchema);
