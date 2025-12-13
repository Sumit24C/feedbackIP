import mongoose from "mongoose";
import { Question } from "./question.model.js";

const questionTemplateSchema = new mongoose.Schema({
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    },
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
    formType: {
        type: String,
        enum: ["practical", "theory", "infrastructure", "quiz"],
        required: true
    },
}, { timestamps: true });

questionTemplateSchema.pre("deleteOne", {
    document: true, query: false
}, async function (next) {
    const question_template = this.getFilter();
    const questionIds = question_template.question
    await Question.findOneAndDelete({ _id: { $in: questionIds } })
});
const QuestionTemplate = mongoose.model("QuestionTemplate", questionTemplateSchema);

export { QuestionTemplate };