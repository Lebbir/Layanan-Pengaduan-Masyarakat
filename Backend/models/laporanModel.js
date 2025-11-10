import mongoose from "mongoose";

const laporanSchema = new mongoose.Schema({
    deskripsi:{type:String,required:true},
    lokasi:{type:String},
    gambar:{type:String,required:true},
    status_laporan:{type:String},
    komentar:{type:String}
})

const laporanModel = mongoose.models.laporan || mongoose.model("laporan", laporanSchema);

export default laporanModel;