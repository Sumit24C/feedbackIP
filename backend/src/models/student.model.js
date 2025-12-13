import mongoose from "mongoose";
import { User } from "./user.model.js";

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
    classSection: {
        type: String,
        required: true,
    },
    electives: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject"
        }
    ]
}, { timestamps: true })

studentSchema.pre("deleteOne", {
    document: true, query: false
}, async function (next) {
    await User.findByIdAndDelete(this.user_id);
    next();
});

const Student = mongoose.model("Student", studentSchema);

export { Student };