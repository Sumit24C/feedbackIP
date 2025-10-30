import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
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
    year: {
        type: String,
        enum: ["FY", "SY", "TY", "BY"],
        required: true
    }
}, { timestamps: true })
facultySubjectSchema.plugin(mongooseAggregatePaginate);
const FacultySubject = mongoose.model("FacultySubject", facultySubjectSchema);

export { FacultySubject };