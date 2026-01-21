import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    hod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
    },
    institute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Institute",
        required: true,
    },
    isConfigured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Department = mongoose.model("Department", departmentSchema);

export { Department };