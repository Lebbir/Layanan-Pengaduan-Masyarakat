import mongoose from "mongoose";

export const connectDB = async () => {
    (await mongoose.connect('mongodb+srv://farrel_db_user:tXb4oyn3kAiQSAXm@cluster0.albb2fe.mongodb.net/?appName=Cluster0')).isObjectIdOrHexString(()=>console.log("DB Connected"));
}