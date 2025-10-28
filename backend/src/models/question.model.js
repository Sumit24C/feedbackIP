import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        trim: true,
        required: true,
    },
    questionType: {
        type: String,
        enum: ["rating", "yes/no", "text"],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty"
    },
}, { timestamps: true })

const Question = mongoose.model("Question", questionSchema);

export { Question };