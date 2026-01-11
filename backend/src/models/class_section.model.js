import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    year: {
        type: String,
        enum: ["FY", "SY", "TY", "BY"],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    strength: {
        type: Number,
        required: true
    },
    batches: [
        {
            code: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: ["practical", "tutorial"],
                required: true
            },
            rollRange: {
                from: Number,
                to: Number
            }
        }
    ]
}, { timestamps: true });

classSchema.index({ dept: 1, year: 1, name: 1 }, { unique: true });

export const ClassSection = mongoose.model("ClassSection", classSchema);