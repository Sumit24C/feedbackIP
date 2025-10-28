import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const responseSchema = new mongoose.Schema({
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeedbackForm",
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    },
    subjectMapping: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubjectMapping",
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
