import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Department } from "../models/department.model.js"
import { Question } from "../models/question.model.js";
import { Form } from "../models/form.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Response } from "../models/response.model.js";
import { FacultySubject } from "../models/faculty_subject.model.js";
import { Admin } from "../models/admin.model.js";

export const createForm = asyncHandler(async (req, res) => {
    const { role } = req.user;
    let creator;
    if (role === "faculty") {
        creator = await Faculty.findOne({ user_id: req.user._id });
        if (!creator) {
            throw new ApiError(404, "Faculty not found");
        }
    } else if (role === "admin") {
        creator = await Admin.findOne({ user_id: req.user._id });
        if (!creator) {
            throw new ApiError(404, "Admin not found");
        }
    } else {
        throw new ApiError(403, "Unauthorized role");
    }

    const {
        title,
        formType,
        deadline,
        questions = [],
        facultySubject = [],
        dept = [],
        ratingConfig,
        targetType,
    } = req.body;

    if (!title || !deadline || !formType || !targetType) {
        throw new ApiError(403, "Title, form type, targetType and deadline are required");
    }

    if (
        !ratingConfig ||
        ratingConfig.min == null ||
        ratingConfig.max == null ||
        ratingConfig.max <= ratingConfig.min
    ) {
        throw new ApiError(403, "Invalid rating configuration");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(403, "At least one question is required");
    }

    if (targetType === "CLASS") {
        if (!facultySubject.length) {
            throw new ApiError(403, "At least one class must be selected");
        }
    } else {
        if (!dept.length) {
            throw new ApiError(403, "At least one department must be selected");
        }
    }

    const formattedQuestions = questions.map(q => {
        if (!q.questionText?.trim()) {
            throw new ApiError(403, "Question text is required");
        }
        return { questionText: q.questionText.trim() };
    });

    const createdQuestions = await Question.insertMany(formattedQuestions);
    const questionIds = createdQuestions.map(q => q._id);

    const formObj = {
        title: title.trim(),
        createdBy: req.user._id,
        deadline,
        formType,
        ratingConfig,
        questions: questionIds,
        targetType
    };

    if (targetType === "CLASS") {
        formObj.facultySubject = facultySubject;
    } else {
        formObj.dept = dept;
    }

    const createdForm = await Form.create(formObj);

    return res.status(201).json(
        new ApiResponse(201, createdForm, "Form created successfully")
    );
});

export const getFacultyClassess = asyncHandler(async (req, res) => {
    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const faculty_subject = await FacultySubject.find({ faculty: faculty._id })
        .select("classSection classYear formType classDepartment subject")
        .populate({
            path: "classDepartment",
            select: "code"
        })
        .populate({
            path: "subject",
            select: "name"
        });

    if (!faculty) {
        throw new ApiError(404, "No subjects found");
    }

    return res.status(200).json(
        new ApiResponse(200, faculty_subject, "successfully fetched classess")
    );
});

export const getFormById = asyncHandler(async (req, res) => {
    const { form_id } = req.params;

    if (!form_id) {
        throw new ApiError(400, "form_id is required");
    }

    const form = await Form.findById(form_id)
        .populate({
            path: "questions",
            select: "questionText"
        })
        .populate({
            path: "facultiessubjects"
        });

    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    return res.status(200).json(
        new ApiResponse(200, form, "Form fetched successfully")
    );
});

export const updateForm = asyncHandler(async (req, res) => {
    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "FormId is required");
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    let { title, formType, questions = [], questionsId = [], deadline, ratingConfig, facultySubject = [], dept = [] } = req.body;
    if ([title, formType, deadline]
        .some((field) => !field || field.trim() === "")) {
        throw new ApiError(403, "All fields are required");
    }

    if (!ratingConfig || ratingConfig.min === null || ratingConfig.max === null) {
        throw new ApiError(403, "Invalid ratings");
    };

    if (!Array.isArray(questionsId)) {
        throw new ApiError(403, "Question IDs must be an array");
    }

    let createdQuestions = [];
    if (Array.isArray(questions) && questions.length > 0) {
        createdQuestions = await Question.insertMany(questions);
        if (!createdQuestions || createdQuestions.length === 0) {
            throw new ApiError(500, "Failed to create new questions");
        }
    };
    questionsId = questionsId.concat(createdQuestions.map((q) => q._id));
    const updatedFormObj = {
        title,
        formType,
        deadline,
        questions: questionsId,
        ratingConfig: ratingConfig,
    }

    if (form.targetType === "CLASS") {
        updatedFormObj.facultySubject = facultySubject;
    } else {
        updatedFormObj.dept = dept;
    }

    const updatedForm = await Form.findByIdAndUpdate(
        form.id,
        updatedFormObj,
        {
            new: true
        });

    if (!updatedForm) {
        throw new ApiError(500, "Failed to update form");
    };

    return res.status(200).json(
        new ApiResponse(200, updatedForm, "successfully updated form")
    );

});

export const deleteForm = asyncHandler(async (req, res) => {
    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "FormId is required");
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    await Form.findByIdAndDelete(form._id);
    await Response.deleteMany({ form: form_id });

    return res.status(200).json(
        new ApiResponse(200, {}, "successfully deleted form")
    );
});

export const getFormsByDept = asyncHandler(async (req, res) => {
    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const forms = await Form.aggregate([
        {
            $match: {
                $or: [
                    {
                        targetType: "CLASS",
                        createdBy: new mongoose.Types.ObjectId(faculty.user_id)
                    },
                    {
                        targetType: "DEPARTMENT",
                        dept: faculty.dept
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "responses",
                localField: "_id",
                foreignField: "form",
                as: "responses"
            }
        },
        {
            $addFields: {
                uniqueStudents: {
                    $size: {
                        $setUnion: [
                            {
                                $map: {
                                    input: "$responses",
                                    as: "r",
                                    in: "$$r.student"
                                }
                            },
                            []
                        ]
                    }
                }
            }
        },
        {
            $project: {
                title: 1,
                deadline: 1,
                formType: 1,
                responseCount: "$uniqueStudents",
                createdAt: 1,
                createdBy: 1,
            }
        },
        {
            $sort: { deadline: 1 }
        }
    ]);

    if (!forms.length) {
        throw new ApiError(500, "Failed to fetch forms");
    };

    return res.status(200).json(
        new ApiResponse(200, forms, "successfully fetched forms")
    );
});