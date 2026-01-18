import { Form } from "../models/form.model.js";
import { Response } from "../models/response.model.js";
import { WeeklyFeedback } from "../models/weekly_feedback.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const finalizeExpiredForms = asyncHandler(async (req, res) => {
    const now = new Date();

    const expiredForms = await Form.find({
        deadline: { $lte: now },
        targetType: "CLASS"
    });

    let createdCount = 0;

    for (const form of expiredForms) {
        for (const facultySubjectId of form.facultySubject) {

            const alreadyFinalized = await WeeklyFeedback.exists({
                facultySubject: facultySubjectId,
                session_start: form.startDate,
            });

            if (alreadyFinalized) continue;

            const responses = await Response.find({
                form: form._id,
                facultySubject: facultySubjectId
            });

            if (responses.length === 0) continue;

            let totalScore = 0;
            let ratingCount = 0;

            for (const response of responses) {
                for (const rating of response.ratings) {
                    totalScore += rating.answer;
                    ratingCount++;
                }
            }

            const avgScore =
                ratingCount === 0 ? 0 : Number((totalScore / ratingCount).toFixed(2));

            await WeeklyFeedback.create({
                facultySubject: facultySubjectId,
                session_start: form.startDate,
                session_end: form.deadline,
                avg_score: avgScore,
                total_responses: responses.length
            });

            createdCount++;
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { createdCount },
            "Weekly feedback finalized successfully"
        )
    );
});
