import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const responseSchema = new mongoose.Schema({
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form",
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    },
    facultySubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FacultySubject",
    },
    responses: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Question",
                required: true,
            },
            answer: {
                type: mongoose.Schema.Types.Mixed,
                required: true,
            },
        },
    ],
}, { timestamps: true });

responseSchema.plugin(mongooseAggregatePaginate);
const Response = mongoose.model("Response", responseSchema);

export { Response };
