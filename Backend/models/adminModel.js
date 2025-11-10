import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    user:{type:String,required:true},
    password:{type:String,required:true}
})

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);

export default adminModel;