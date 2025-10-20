import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",   
    },
    isHOD: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

const Faculty = mongoose.model("Faculty", facultySchema);

export { Faculty };