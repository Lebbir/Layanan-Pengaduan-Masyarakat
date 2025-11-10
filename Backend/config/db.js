import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        (await mongoose.connect(process.env.MONGO_URI)).isObjectIdOrHexString(()=>console.log("DB Connected"));
    } catch (error) {
        console.error("Mongodb koneksi error", error.message);
    }
}