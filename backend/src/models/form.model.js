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
        enum: ["CLASS", "DEPARTMENT", "GLOBAL"],
        required: true
    },
    facultySubject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "FacultySubject",
    }],
    dept: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    }],
    deadline: {
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

formSchema.pre("findOneAndDelete", async function (next) {
    const form = await this.model.findOne(this.getFilter());

    if (form?.questions?.length) {
        await mongoose.model("Question").deleteMany({
            _id: { $in: form.questions }
        });
    }

    next();
});

const Form = mongoose.model("Form", formSchema);

export { Form };