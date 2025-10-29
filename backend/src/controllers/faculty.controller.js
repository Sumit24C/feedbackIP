import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Department } from "../models/department.model.js"
import { QuestionTemplate } from "../models/question_template.model.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js"
import { Faculty } from "../models/faculty.model.js"

export const getOverallFeedbackResult = asyncHandler(async (req, res) => {
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

    const overallSummary = await Response.aggregate([
        {
            $match: {
                form: new mongoose.Types.ObjectId(form_id)
            }
        },

        { $unwind: "$responses" },

        {
            $group: {
                _id: "$subjectMapping", // subjectMappingId
                avgRating: { $avg: "$responses.answer" },
                totalResponses: { $sum: 1 }
            }
        },

        {
            $lookup: {
                from: "facultysubjects",   // ✅ Correct collection name
                localField: "_id",
                foreignField: "_id",
                as: "subject"
            }
        },
        { $unwind: "$subject" },

        {
            $project: {
                subjectMappingId: "$_id",
                subjectName: "$subject.subject",
                classSection: "$subject.classSection",
                formType: "$subject.formType",
                avgRating: 1,
                totalResponses: 1
            }
        }
    ]);



    if (overallSummary.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No feedback submitted yet")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, overallSummary, "successfully fetched overall summary")
    );
});

export const getFeedbackResultBySubjects = asyncHandler(async (req, res) => {
    const { form_id, subject_mapping_id } = req.params;

    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    }
    if (!subject_mapping_id) {
        throw new ApiError(403, "subjectMapping Id is required");
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }
    const subjectMapping = await FacultySubject.findById(subject_mapping_id);
    if (!subjectMapping) {
        throw new ApiError(404, "subjectMapping not found");
    }

    const subjectQuestionSummary = await Response.aggregate([
        {
            $match: {
                form: new mongoose.Types.ObjectId(form_id),
                subjectMapping: new mongoose.Types.ObjectId(subject_mapping_id)
            }
        },

        { $unwind: "$responses" },

        {
            $group: {
                _id: "$responses.questionId",
                avgRating: { $avg: "$responses.answer" },
                totalResponses: { $sum: 1 }
            }
        },

        {
            $lookup: {
                from: "questions",
                localField: "_id",
                foreignField: "_id",
                as: "question"
            }
        },
        { $unwind: "$question" },

        {
            $project: {
                questionId: "$question._id",
                questionText: "$question.text",
                avgRating: 1,
                totalResponses: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            subjectQuestionSummary.length > 0 ? subjectQuestionSummary : [],
            "successfully fetched question summary"
        )
    );
});

export const getSubjectMapping = asyncHandler(async (req, res) => {
    // Input: get all subjectMappings for practical/theory
    // 1. Fetch all subjectMappings
    // 3. Return subjectMappings
    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const subjectMappings = await FacultySubject.find({ faculty: faculty._id }).populate("dept");
    if (subjectMappings.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No subjects assigned to this faculty")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, subjectMappings, "successfully fetched subjects mapping")
    );
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

    const questionTemplates = await QuestionTemplate.find().populate("question");
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

    if (!question_template_id) {
        throw new ApiError(403, "Department Id is required");
    }

    const questionTemplate = await QuestionTemplate.findById(question_template_id).populate("question");
    if (!questionTemplate) {
        throw new ApiError(404, "QuestionTemplate not found");
    }

    return res.status(200).json(
        new ApiResponse(200, questionTemplate, "successfully fetched question template")
    );
});

export const getAllFacultyResultsForHOD = asyncHandler(async (req, res) => {
    const { form_id } = req.params;

    if (!form_id) throw new ApiError(403, "Form Id is required");

    const form = await Form.findById(form_id);
    if (!form) throw new ApiError(404, "Form not found");

    const facultyHOD = await Faculty.findOne({ user_id: req.user._id });
    if (!facultyHOD || !facultyHOD.isHOD) {
        throw new ApiError(404, "HOD not found");
    }

    const hodDeptId = facultyHOD.dept;

    const overallSummary = await Response.aggregate([
        {
            $match: {
                form: new mongoose.Types.ObjectId(form_id)
            }
        },

        { $unwind: "$responses" },

        {
            $group: {
                _id: "$subjectMapping",
                avgRating: { $avg: "$responses.answer" },
                totalResponses: { $sum: 1 }
            }
        },

        // ✅ Lookup subject mapping
        {
            $lookup: {
                from: "facultysubjects",
                localField: "_id",
                foreignField: "_id",
                as: "subject"
            }
        },
        { $unwind: "$subject" },

        // ✅ Only subjects from HOD's department
        {
            $match: {
                "subject.dept": new mongoose.Types.ObjectId(hodDeptId)
            }
        },

        // ✅ Lookup faculty details
        {
            $lookup: {
                from: "faculties",
                localField: "subject.faculty",
                foreignField: "_id",
                as: "faculty"
            }
        },
        { $unwind: "$faculty" },

        {
            $project: {
                subjectMappingId: "$_id",
                subjectName: "$subject.subject",
                classSection: "$subject.classSection",
                formType: "$subject.formType",
                year: "$subject.year",

                facultyName: "$faculty.name",
                facultyEmail: "$faculty.email",
                isHOD: "$faculty.isHOD",

                avgRating: 1,
                totalResponses: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, overallSummary, "successfully fetched HOD faculty results")
    );
});
