import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Department } from "../models/department.model.js"
import { Question } from "../models/question.model.js";
import { Form } from "../models/form.model.js";
import { QuestionTemplate } from "../models/question_template.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Response } from "../models/response.model.js";

export const createQuestionTemplate = asyncHandler(async (req, res) => {
    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const department = await Department.findById(faculty.dept);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }
    const { questions, formType, name } = req.body;

    console.log("form:", formType);
    if (!formType || !name) {
        throw new ApiError(403, "Form type and Name is required");
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, "Please provide an array of questions");
    }

    for (const q of questions) {
        if (!q.questionText || !q.questionType) {
            throw new ApiError(400, "Each question must have questionText and questionType");
        }
    }

    const formattedQuestions = questions.map((q) => ({
        ...q, createdBy: req.user._id
    }));

    const createdQuestions = await Question.insertMany(formattedQuestions);
    if (!createdQuestions) {
        throw new ApiError(500, "Failed to create questions");
    }
    const createdQuestionsId = createdQuestions.map((q) => q._id);

    const createdQuestionTemplate = await QuestionTemplate.create({
        name: name,
        question: createdQuestionsId,
        formType: formType,
        createdBy: req.user._id,
        dept: department._id,
    });
    if (!createdQuestionTemplate) {
        throw new ApiError(500, "Failed to question template");
    }
    return res.status(200).json(
        new ApiResponse(200, createdQuestionTemplate, "successfully created question template")
    );
});

export const createForm = asyncHandler(async (req, res) => {
    // Input: dept_id, title, formType, deadline, questions: [{questionText, optional: createdBy}]
    // 1. Validate dept exists
    // 2. Loop through questions:
    //    a. If new, create Question document
    //    b. Collect questionIds
    // 3. Create Form document linking deptId, questions, formType, deadline
    // 4. Return created form

    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const department = await Department.findById(faculty.dept);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    let { title, formType, questions = [], questionsId = [], deadline } = req.body;
    if ([title, formType, deadline]
        .some((field) => !field || field.trim() === "")) {
        throw new ApiError(403, "All fields are required");
    };

    if (!Array.isArray(questionsId)) {
        throw new ApiError(403, "Question IDs must be an array");
    };

    let createdQuestions = [];
    if (Array.isArray(questions) && questions.length > 0) {
        const formattedQuestions = questions.map((q) => ({ ...q, createdBy: req.user._id }));
        createdQuestions = await Question.insertMany(formattedQuestions);
        if (!createdQuestions || createdQuestions.length === 0) {
            throw new ApiError(500, "Failed to create new questions");
        }
        questionsId = questionsId.concat(createdQuestions.map((q) => q._id));
    };

    const createdForm = await Form.create({
        title,
        formType,
        deadline,
        questions: questionsId,
        dept: faculty.dept,
        createdBy: req.user._id,
    });

    if (!createdForm) {
        throw new ApiError(500, "Failed to create new form");
    };

    return res.status(200).json(
        new ApiResponse(200, createdForm, "successfully created form")
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
            select: "questionText questionType"
        });

    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    return res.status(200).json(
        new ApiResponse(200, form, "Form fetched successfully")
    );
});

export const updateForm = asyncHandler(async (req, res) => {
    // Input: form_id, updated title, deadline, questions
    // 1. Validate form exists
    // 2. Add/remove questions as needed
    // 3. Update other fields (title, deadline)
    // 4. Return updated form

    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "FormId is required");
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    let { title, formType, questions = [], questionsId = [], deadline } = req.body;
    if ([title, formType, deadline]
        .some((field) => !field || field.trim() === "")) {
        throw new ApiError(403, "All fields are required");
    }

    if (!Array.isArray(questionsId)) {
        throw new ApiError(403, "Question IDs must be an array");
    }

    let createdQuestions = [];
    if (Array.isArray(questions) && questions.length > 0) {
        const formattedQuestions = questions.map((q) => ({ ...q, createdBy: req.user._id }));
        createdQuestions = await Question.insertMany(formattedQuestions);
        if (!createdQuestions || createdQuestions.length === 0) {
            throw new ApiError(500, "Failed to create new questions");
        }
        questionsId = questionsId.concat(createdQuestions.map((q) => q._id));
    };

    const updatedForm = await Form.findByIdAndUpdate(
        form.id,
        {
            title,
            formType,
            deadline,
            questions: questionsId,
        },
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
    // Input: form_id
    // validate if the form exists
    //delete the form

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
    // Input: dept_id
    // 1. Fetch all subjects for the faculty
    // 2. Aggregate results by subjectMappingId / question
    // 3. Return summary (average ratings, counts, etc.)
    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const department = await Department.findById(faculty.dept);
    if (!department) {
        throw new ApiError(404, "Department not found");
    };

    const forms = await Form.aggregate([
        {
            $match: {
                dept: new mongoose.Types.ObjectId(faculty.dept)
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
                // ✅ extract unique student IDs from responses
                uniqueStudents: {
                    $size: {
                        $setUnion: [
                            {
                                $map: {
                                    input: "$responses",
                                    as: "r",
                                    in: "$$r.student"  // <-- pick student field
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
                responseCount: "$uniqueStudents", // ✅ replace count
                createdAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);


    if (!forms.length) {
        throw new ApiError(500, "Failed to fetch forms");
    };

    return res.status(200).json(
        new ApiResponse(200, forms, "successfully fetched forms")
    );
});