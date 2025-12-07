import mongoose from "mongoose";

const oauthSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    provider: {
        type: String,
        enum: ["google", "github"],
        required: true
    },
    provider_account_id: {
        type: String,
        unique: true,
        required: true
    }
}, {timestamps: true})

export const OAuth = mongoose.model("OAuth", oauthSchema);