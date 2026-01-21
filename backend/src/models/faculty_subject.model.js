import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const facultySubjectSchema = new mongoose.Schema({
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        required: true
    },
    facultyName: {
        type: String,
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassSection",
    },
    batch_code: {
        type: String,
        required: function () {
            return this.formType === "tutorial";
        }
    },
    formType: {
        type: String,
        enum: ["theory", "practical", "tutorial"],
        default: "theory"
    }
}, { timestamps: true });

facultySubjectSchema.index(
    {
        faculty: 1,
        subject: 1,
        class_id: 1,
        formType: 1,
        batch_code: 1,
    },
    { unique: true }
);

facultySubjectSchema.plugin(mongooseAggregatePaginate);
const FacultySubject = mongoose.model("FacultySubject", facultySubjectSchema);

export { FacultySubject };