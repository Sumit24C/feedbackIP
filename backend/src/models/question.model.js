import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        trim: true,
        required: true,
    },
    questionType: {
        type: String,
        enum: ["rating", "options", "boolean", "text", "quiz"],
        required: true,
    },
    ratingConfig: {
        min: { type: Number },
        max: { type: Number },
        steps: { type: Number, default: 1 },
    },
    optionsConfig: [
        {
            type: String,
            trim: true
        }
    ],
    allowMultiple: {
        type: Boolean,
        default: false
    },
    quizConfig: {
        options: [{
            text: {
                type: String,
                trim: true
            },
            marks: {
                type: Number,
                default: 1
            }
        }],
        correctAnswers: [{ type: Number }],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty"
    },
}, { timestamps: true })

questionSchema.pre("validate", function (next) {
    const q = this;
    if (q.questionType === "rating") {
        if (!q.ratingConfig?.min || !!q.ratingConfig?.max) {
            return next(new Error("Rating questions require min and max values."));
        }
    } else if (q.questionType === "options") {
        if (!q.optionsConfig || q.optionsConfig.length < 2) {
            return next(new Error("Options questions require at least two options"));
        }
    } else if (q.questionType === "quiz") {
        if (!q.quizConfig?.options || q.quizConfig?.options.length < 2) {
            return next(new Error("Quiz questions require at least two question"));
        }
        if (!q.quizConfig?.correctAnswers || q.quizConfig?.correctAnswers.length === 0) {
            return next(new Error("Quiz questions require at least two question"));
        }
    }
    next();
});

const Question = mongoose.model("Question", questionSchema);

export { Question };