import mongoose from "mongoose";
import aggregatePipeline from "mongoose-aggregate-paginate-v2";

const formSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    targetType: {
        type: String,
        enum: ["CLASS", "DEPARTMENT", "INSTITUTE"],
        required: true
    },
    facultySubject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "FacultySubject",
    }],
    //this is used only if form is for whole department
    dept: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: function () {
            this.targetType !== "CLASS"
        }
    }],
    deadline: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    ratingConfig: {
        min: { type: Number, required: true },
        max: {
            type: Number, required: true, validate: {
                validator: function (v) {
                    return v > this.ratingConfig.min;
                },
                message: "max must be greater than min"
            }
        },
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    }],
    formType: {
        type: String,
        enum: ["practical", "theory", "tutorial", "infrastructure",],
        required: true
    }
}, { timestamps: true });

const Form = mongoose.model("Form", formSchema);

export { Form };