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
        enum: ["theory", "practical"],
        default: "theory"
    },
}, { timestamps: true });

facultySubjectSchema.plugin(mongooseAggregatePaginate);
const FacultySubject = mongoose.model("FacultySubject", facultySubjectSchema);

export { FacultySubject };