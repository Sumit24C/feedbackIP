import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    code: {
        type: String,
        unique: true,
        required: true
    },
    hod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
    },
    isConfigured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Department = mongoose.model("Department", departmentSchema);

export { Department };