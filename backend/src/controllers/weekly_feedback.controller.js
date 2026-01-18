import { Form } from "../models/form.model.js";
import { Response } from "../models/response.model.js";
import { WeeklyFeedback } from "../models/weekly_feedback.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const finalizeExpiredForms = asyncHandler(async (req, res) => {
  const now = new Date();
  let createdCount = 0;

  const expiredForms = await Form.find({
    deadline: { $lte: now },
    targetType: "CLASS",
  });

  for (const form of expiredForms) {
    for (const facultySubjectId of form.facultySubject) {
      const responses = await Response.find({
        form: form._id,
        facultySubject: facultySubjectId,
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

      if (ratingCount === 0) continue;

      const avgScore = Number(
        (totalScore / ratingCount).toFixed(2)
      );

      try {
        await WeeklyFeedback.create({
          facultySubject: facultySubjectId,
          session_start: form.startDate,
          session_end: form.deadline,
          avg_score: avgScore,
          total_responses: responses.length,
        });

        createdCount++;
      } catch (err) {
        if (err.code !== 11000) {
          throw err;
        }
      }
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

export const getWeeklyFeedback = asyncHandler(async (req, res) => {
  const { facultySubjectId } = req.params;

  if (!facultySubjectId) {
    throw new ApiError(400, "FacultySubjectId is required");
  }

  const weeklyFeedbackResponse = await WeeklyFeedback
    .find({ facultySubject: facultySubjectId })
    .sort({ session_start: 1 });

  if (weeklyFeedbackResponse.length === 0) {
    throw new ApiError(404, "Weekly feedback not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      weeklyFeedbackResponse,
      "Successfully fetched weekly feedback"
    )
  );
});
