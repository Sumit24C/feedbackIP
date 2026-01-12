import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["CLASS", "DEPARTMENT", "INSTITUTE"],
      required: true,
    },
    facultySubject: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FacultySubject",
        required: function () {
          return this.targetType === "CLASS";
        },
      },
    ],
    dept: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: function () {
          return this.targetType !== "CLASS";
        },
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    ratingConfig: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
    },
    questions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one question is required",
      },
      required: true,
    },
    formType: {
      type: String,
      enum: ["practical", "theory", "tutorial", "infrastructure"],
      required: true,
    },
  },
  { timestamps: true }
);

formSchema.pre("validate", function (next) {
  if (this.ratingConfig.max <= this.ratingConfig.min) {
    return next(
      new Error("ratingConfig.max must be greater than ratingConfig.min")
    );
  }
  next();
});

formSchema.plugin(aggregatePaginate);

const Form = mongoose.model("Form", formSchema);
export { Form };
