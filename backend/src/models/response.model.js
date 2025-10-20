import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeedbackForm",
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
    },
    subjectMapping: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubjectMapping",
        required: true,
    },
    responses: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Question",
                required: true,
            },
            rating: {
                type: Number,
                min: 1,
                max: 5,
            },
        },
    ],
}, { timestamps: true });

const Response = mongoose.model("Response", responseSchema);

export { Response };
