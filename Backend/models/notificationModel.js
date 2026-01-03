import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    notificationType: { type: String, enum: ["task", "system", "laporan"], default: "task" },
    recipientType: { type: String, enum: ["admin", "petugas"], default: "petugas" },
    recipient: { type: mongoose.Schema.Types.ObjectId },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "task" },
    laporan: { type: mongoose.Schema.Types.ObjectId, ref: "laporan" },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("notification", notificationSchema);
