import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    formType: {
        type: String,
        enum: ["practical", "theory", "infrastructure"],
        required: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
    }],
    deadline:{
        type: Date,
        required: true
    },
}, { timestamps: true })

const Form = mongoose.model("Form", formSchema);

export { Form };