import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const facultySubjectSchema = new mongoose.Schema({
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
    },
    classSection: {
        type: String,
        required: true
    },
    formType: {
        type: String,
        enum: ["theory", "practical", "tutorial"],
        default: "theory"
    },
    classDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    classYear: {
        type: String,
        enum: ["FY", "SY", "TY", "BY"],
        required: true
    }
}, { timestamps: true });

facultySubjectSchema.index(
    {
        faculty: 1,
        subject: 1,
        classDepartment: 1,
        classYear: 1,
        classSection: 1,
        formType: 1,
    },
    { unique: true }
);

facultySubjectSchema.plugin(mongooseAggregatePaginate);
const FacultySubject = mongoose.model("FacultySubject", facultySubjectSchema);

export { FacultySubject };