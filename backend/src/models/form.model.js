import mongoose from "mongoose";
import aggregatePipeline from "mongoose-aggregate-paginate-v2";

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
    deadline: {
        type: Date,
        required: true
    },
}, { timestamps: true })

formSchema.pre("deleteMany", async function (next) {
    try {
        const filter = this.getFilter();
        const forms = await mongoose.model("Form").find(filter);

        const quesIds = forms.flatMap((form) => form.questions);

        if (quesIds.length > 0) {
            await mongoose.model("Question").deleteMany({ _id: { $in: quesIds } });
        }
        next();
    } catch (err) {
        next(err);
    }
});


const Form = mongoose.model("Form", formSchema);

export { Form };