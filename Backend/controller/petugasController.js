import Petugas from "../models/petugasModel.js";

const createPetugas = async (req, res) => {
  try {
    const petugas = await Petugas.create(req.body);
    res.status(201).json({ success: true, data: petugas });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPetugas = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};
    if (typeof isActive !== "undefined") {
      query.isActive = isActive === "true";
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }
    const petugas = await Petugas.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: petugas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePetugas = async (req, res) => {
  try {
    const petugas = await Petugas.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!petugas) {
      return res
        .status(404)
        .json({ success: false, message: "Petugas tidak ditemukan" });
    }
    res.json({ success: true, data: petugas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const togglePetugasStatus = async (req, res) => {
  try {
    const petugas = await Petugas.findById(req.params.id);
    if (!petugas) {
      return res
        .status(404)
        .json({ success: false, message: "Petugas tidak ditemukan" });
    }
    petugas.isActive = !petugas.isActive;
    await petugas.save();
    res.json({ success: true, data: petugas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createPetugas, getPetugas, updatePetugas, togglePetugasStatus };
