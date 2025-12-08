import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const attendanceSchema = new mongoose.Schema({
    facultySubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FacultySubject"
    },
    students: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },
        isPresent: {
            type: Boolean,
            required: true
        }
    }],
}, { timestamps: true })

attendanceSchema.plugin(mongooseAggregatePaginate);

export const Attendance = mongoose.model("Attendance", attendanceSchema);