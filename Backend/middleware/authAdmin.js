// middleware/authAdmin.js
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

const authAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak, silakan login (admin)",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin tidak ditemukan",
      });
    }

    // Validasi role administrator
    if (admin.role !== "administrator") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya administrator yang diizinkan",
      });
    }

    req.admin = admin; // gunakan req.admin di controller admin
    next();
  } catch (error) {
    console.error("authAdmin error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token admin tidak valid atau kadaluarsa",
    });
  }
};

export default authAdmin;
