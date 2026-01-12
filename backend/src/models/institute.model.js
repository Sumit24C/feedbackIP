import mongoose from "mongoose";

const instituteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    emailDomain: {
        type: String,
        unique: true,
        lowercase: true,
    },
    logo: {
        type: String,
    },
}, { timestamps: true });

export const Institute = mongoose.model("Institute", instituteSchema);
