import mongoose from "mongoose";
import { User } from "./user.model.js";

const studentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassSection",
        required: true,
    },
    roll_no: {
        type: Number,
        required: true,
    },
    academic_year: {
        type: Number,
        required: true,
    },
}, { timestamps: true })

studentSchema.index({ class_id: 1, roll_no: 1 }, { unique: true });

studentSchema.pre("deleteOne", {
    document: true, query: false
}, async function (next) {
    await User.findByIdAndDelete(this.user_id);
    next();
});

const Student = mongoose.model("Student", studentSchema);

export { Student };