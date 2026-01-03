import mongoose from "mongoose";

const petugasSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    role: { type: String, default: "petugas" },
    department: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    skills: { type: [String], default: [] },
    maxCapacity: { type: Number, default: 5 },
    currentLoad: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("petugas", petugasSchema);
