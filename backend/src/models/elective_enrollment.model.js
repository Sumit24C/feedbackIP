import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const electiveEnrollmentSchema = new mongoose.Schema({
    facultySubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FacultySubject",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
}, { timestamps: true });

electiveEnrollmentSchema.index(
    { student: 1, facultySubject: 1 },
    { unique: true }
);

electiveEnrollmentSchema.plugin(mongooseAggregatePaginate);

const ElectiveEnrollment = mongoose.model(
    "ElectiveEnrollment",
    electiveEnrollmentSchema
);

export { ElectiveEnrollment };
