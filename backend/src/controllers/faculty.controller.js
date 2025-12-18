import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Department } from "../models/department.model.js"
// import { QuestionTemplate } from "../models/question_template.model.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js"
import { Faculty } from "../models/faculty.model.js"
import { Question } from "../models/question.model.js"

export const getOverallFeedbackResult = asyncHandler(async (req, res) => {

    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(400, "Form Id is required");
    };

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    };

    const faculty = await Faculty.findOne({ user_id: req?.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const facultySubjects = await FacultySubject.find({ faculty: faculty._id });
    const facultySubjectIds = facultySubjects.map((fs) => fs._id);

    const overallSummary = await Response.aggregate([
        {
            $match: {
                form: new mongoose.Types.ObjectId(form_id),
                facultySubject: { $in: facultySubjectIds }
            }
        },
        {
            $lookup: {
                from: "facultysubjects",
                localField: "facultySubject",
                foreignField: "_id",
                as: "facultySubjectData"
            }
        },
        { $unwind: "$facultySubjectData" },
        { $unwind: "$ratings" },
        {
            $addFields: {
                "ratings.answer": {
                    $convert: {
                        input: "$ratings.answer",
                        to: "double",
                        onError: null,
                        onNull: null
                    }
                }
            }
        },
        { $unwind: "$facultySubjectData" },
        {
            $sort: { classSection: 1 }
        },
        {
            $group: {
                _id: {
                    classSection: "$facultySubjectData.classSection",
                    student: "$student",
                },
                avgRatingPerStudent: { $avg: "$ratings.answer" }
            }
        },
        {
            $group: {
                _id: "$_id.classSection",
                totalResponses: { $sum: 1 },
                avgRating: { $avg: "$avgRatingPerStudent" },
            }
        },
    ]);

    if (overallSummary.length === 0) {
        throw new ApiError(500, "Failed to fetch overall summary");
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
                facultySubject: new mongoose.Types.ObjectId(subject_mapping_id),
            }
        },
        { $unwind: "$ratings" },
        {
            $addFields: {
                "ratings.answer": {
                    $convert: {
                        input: "$ratings.answer",
                        to: "double",
                        onError: null,
                        onNull: null
                    }
                }
            }
        },
        {
            $group: {
                _id: "$ratings.questionId",
                avgRating: { $avg: "$ratings.answer" },
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
                questionText: "$question.questionText",
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
    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }
    const { form_id } = req.params;
    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }
    const subjectMappings = await FacultySubject.find({ faculty: faculty._id, formType: form.formType }).populate("classDepartment subject", "name");
    if (subjectMappings.length === 0) {
        throw new ApiError(404, "No Subjects found");
    }

    return res.status(200).json(
        new ApiResponse(200, subjectMappings, "successfully fetched subjects mapping")
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
                avgRating: { $avg: "$ratings.answer" },
                totalResponses: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "facultysubjects",
                localField: "_id",
                foreignField: "_id",
                as: "subject"
            }
        },
        { $unwind: "$subject" },
        {
            $match: {
                "subject.dept": new mongoose.Types.ObjectId(hodDeptId)
            }
        },
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
