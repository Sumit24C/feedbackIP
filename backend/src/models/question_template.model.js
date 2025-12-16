import mongoose from "mongoose";
import { Question } from "./question.model.js";

const questionTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    question: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true });

export const QuestionTemplate = mongoose.model("QuestionTemplate", questionTemplateSchema);
