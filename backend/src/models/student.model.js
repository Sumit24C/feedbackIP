import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    },
    roll_no: {
        type: Number,
        required: true,
    },
    academic_year: {
        type: Number,
        required: true,
    },
    classSection: [{
        type: String,
        required: true,
    }],
}, { timestamps: true })

const Student = mongoose.model("Student", studentSchema);

export { Student };