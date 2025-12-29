import { v2 as cloudinary } from "cloudinary";
import stream from "stream";
import "dotenv/config";

// Konfigurasi
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadFiletoCloudinary = (fileObject) => {
  return new Promise((resolve, reject) => {
    if (!fileObject || !fileObject.buffer) {
      return reject(new Error("File object atau buffer tidak valid"));
    }

    const uploadOptions = {
      folder: "laporan_desa",
      resource_type: "auto",
    };

    console.log(`[Upload] Type: ${fileObject.mimetype}`);

    // Buat stream upload
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary Error:", error);
          reject(error);
        } else {
          console.log(`[Upload Success] URL: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );

    // Ubah buffer file menjadi stream agar bisa diupload
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);
    bufferStream.pipe(uploadStream);
  });
};

export { uploadFiletoCloudinary };
