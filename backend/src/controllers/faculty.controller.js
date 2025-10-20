import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"

export const getFeedbackResult = asyncHandler(async (req, res) => {
    // Input: form_id
    // 1. Fetch all responses for the form
    // 2. Aggregate results by subjectMappingId / question
    // 3. Return summary (average ratings, counts, etc.)
});

export const getQuestionTemplates = asyncHandler(async (req, res) => {
    // Input: get all questions for practical/theory
    // 1. Fetch all questions
    // 3. Return question
});