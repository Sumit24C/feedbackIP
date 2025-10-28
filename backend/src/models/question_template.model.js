import mongoose from "mongoose";

const questionTemplateSchema = new mongoose.Schema({
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
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
        enum: ["practical", "theory", "infrastructure"],
        required: true
    },
}, { timestamps: true });

const QuestionTemplate = mongoose.model("QuestionTemplate", questionTemplateSchema);

export { QuestionTemplate };