import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Department } from "../models/department.model.js"
import { QuestionTemplate } from "../models/question_template.model.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"

export const getFeedbackResult = asyncHandler(async (req, res) => {
    // Input: form_id
    // 1. Fetch all responses for the form
    // 2. Aggregate results by subjectMappingId / question
    // 3. Return summary (average ratings, counts, etc.)

    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    };

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    };

    const responses = await Response.aggregate([

    ]);

});

export const getAllQuestionTemplates = asyncHandler(async (req, res) => {
    // Input: get all questions for practical/theory
    // 1. Fetch all questions
    // 3. Return question
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "Department Id is required");
    };

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    };

    const questionTemplates = await QuestionTemplate.find();
    if (!questionTemplates) {
        throw new ApiError(500, "Failed to fetch question template");
    }

    return res.status(200).json(
        new ApiResponse(200, questionTemplates, "successfully fetched question templates")
    );
});

export const getQuestionTemplateById = asyncHandler(async (req, res) => {
    // Input: get all questions for practical/theory
    // 1. Fetch all questions
    // 3. Return question
    const { dept_id, question_template_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "Department Id is required");
    };

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    };

    if(!question_template_id){
        throw new ApiError(403, "Department Id is required");
    }

    const questionTemplate = await QuestionTemplate.findById(question_template_id);
    if (!questionTemplate) {
        throw new ApiError(404, "QuestionTemplate not found");
    }

    return res.status(200).json(
        new ApiResponse(200, questionTemplate, "successfully fetched question template")
    );
});

