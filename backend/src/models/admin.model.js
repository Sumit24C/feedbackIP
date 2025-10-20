import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    //for future use case
    permission: {
        type: String,
    }
}, { timestamps: true })

const Admin = mongoose.model("Admin", adminSchema);

export { Admin };