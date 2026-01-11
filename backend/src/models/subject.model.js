import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    },
    subject_code: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        enum: ["FY", "SY", "TY", "BY"],
        required: true,
    },
    type: {
        type: String,
        enum: ["dept", "elective"],
        required: true,
    },
    semester: {
        type: String,
        enum: ["even", "odd"],
        required: true
    }
}, { timestamps: true })

const Subject = mongoose.model("Subject", subjectSchema);

export { Subject };