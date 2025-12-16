import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        trim: true,
        required: true,
    },
}, { timestamps: true });

const Question = mongoose.model("Question", questionSchema);

export { Question };