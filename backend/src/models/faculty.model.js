import mongoose from "mongoose";
import { User } from "./user.model.js";

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
}, { timestamps: true });

facultySchema.pre("deleteOne", {
    document: true, query: false
}, async function (next) {
    await User.findByIdAndDelete(this.user_id);
    next();
});

const Faculty = mongoose.model("Faculty", facultySchema);

export { Faculty };