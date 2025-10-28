import mongoose from "mongoose";

const facultySubjectSchema = new mongoose.Schema({
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    },
    classSection: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    formType: {
        type: String,
        enum: ["theory", "practical"],
        default: "theory"
    },
}, { timestamps: true })

const FacultySubject = mongoose.model("FacultySubject", facultySubjectSchema);

export { FacultySubject };