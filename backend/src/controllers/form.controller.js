import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"

export const createForm = asyncHandler(async (req, res) => {
    // Input: dept_id, title, formType, deadline, questions: [{questionText, optional: createdBy}]
    // 1. Validate dept exists
    // 2. Loop through questions:
    //    a. If new, create Question document
    //    b. Collect questionIds
    // 3. Create Form document linking deptId, questions, formType, deadline
    // 4. Return created form
});

export const updateForm = asyncHandler(async (req, res) => {
    // Input: form_id, updated title, deadline, questions
    // 1. Validate form exists
    // 2. Add/remove questions as needed
    // 3. Update other fields (title, deadline)
    // 4. Return updated form
});


export const deleteForm = asyncHandler(async (req, res) => {
    // Input: form_id
    // validate if the form exists
    //delete the form
});

export const getFormsByDept = asyncHandler(async (req, res) => {
    // Input: faculty_id
    // 1. Fetch all subjects for the faculty
    // 2. Aggregate results by subjectMappingId / question
    // 3. Return summary (average ratings, counts, etc.)
});




