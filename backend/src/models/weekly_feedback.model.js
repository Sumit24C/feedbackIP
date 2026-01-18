import mongoose from "mongoose";

const weeklyFeedbackSchema = new mongoose.Schema({
    facultySubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FacultySubject",
        required: true,
    },
    session_start: {
        type: Date,
        required: true,
    },
    session_end: {
        type: Date,
        required: true
    },
    avg_score: {
        type: Number,
        required: true,
    },
    total_responses: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

weeklyFeedbackSchema.index(
    { facultySubject: 1, session_start: 1 },
    { unique: true }
);

const WeeklyFeedback = mongoose.model("WeeklyFeedback", weeklyFeedbackSchema);

export { WeeklyFeedback };