import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"

export const submitResponse = asyncHandler(async (req, res) => {
    // Input: form_id, student_id,subjectMappingId, responses: [{q_id: answer}}]
    // 1. Validate form exists and is active
    // 2. Validate student exists
    // 3. Check if student already submitted for same subjectMappingId
    // 4. Create Response documents for each subjectMappingId
    // 5. Return success message
});
