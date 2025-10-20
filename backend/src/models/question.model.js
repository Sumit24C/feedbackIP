import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        trim: true,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty"
    },
    formType: {
        type: String,
        enum: ["practical", "theory", "infrastructure"],
        required: true
    },
}, { timestamps: true })

const Question = mongoose.model("Question", questionSchema);

export { Question };