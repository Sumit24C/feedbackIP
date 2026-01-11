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
        startDate,
        deadline,
        questions = [],
        existingQuestionIds = [],
        facultySubject = [],
        dept = [],
        ratingConfig,
        targetType,
    } = req.body;

    if (!title || !deadline || !formType || !targetType || !startDate) {
        throw new ApiError(403, "Title, form type, targetType, startDate and deadline are required");
    }

    if (
        !ratingConfig ||
        ratingConfig.min == null ||
        ratingConfig.max == null ||
        ratingConfig.max <= ratingConfig.min
    ) {
        throw new ApiError(403, "Invalid rating configuration");
    }

    if (
        (!Array.isArray(questions) || questions.length === 0) &&
        (!Array.isArray(existingQuestionIds) || existingQuestionIds.length === 0)
    ) {
        throw new ApiError(403, "At least one question is required");
    }

    if (targetType === "CLASS") {
        if (!facultySubject.length) {
            throw new ApiError(403, "At least one class must be selected");
        }
    } else if (req?.user?.role === "admin" && targetType === "DEPARTMENT") {
        if (!dept.length) {
            throw new ApiError(403, "At least one department must be selected");
        }
    }

    const formattedQuestions = questions.map(q => {
        if (!q.trim()) {
            throw new ApiError(403, "Question text is required");
        }
        return { questionText: q.trim() };
    });

    const createdQuestions = await Question.insertMany(formattedQuestions);
    const questionIds = createdQuestions.map(q => q._id);

    const foundQuestions = await Question.find(
        { _id: { $in: existingQuestionIds } },
        { _id: 1 }
    );

    if (foundQuestions.length !== existingQuestionIds.length) {
        throw new ApiError(403, "One or more question IDs are invalid");
    }

    const formObj = {
        title: title.trim(),
        createdBy: req.user._id,
        deadline,
        startDate,
        formType,
        ratingConfig,
        questions: [...questionIds, ...existingQuestionIds],
        targetType
    };

    if (targetType === "CLASS") {
        formObj.facultySubject = facultySubject;
    } else if (targetType === "DEPARTMENT") {
        if (req.user.role === "faculty") {
            if (!creator?.dept) {
                throw new ApiError(400, "Faculty department not found");
            }
            formObj.dept = [creator.dept];
        } else if (req.user.role === "admin") {
            if (!dept || dept.length === 0) {
                throw new ApiError(400, "Department is required");
            }
            formObj.dept = dept;
        } else {
            throw new ApiError(403, "Unauthorized to create department form");
        }
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

    const facultySubject = await FacultySubject.find({ faculty: faculty._id })
        .select("formType class_id subject batch_code")
        .populate({
            path: "class_id",
            populate: {
                path: "dept",
                select: "code"
            },
        })
        .populate({
            path: "subject",
            select: "name"
        });

    if (!Array.isArray(facultySubject) || facultySubject.length === 0) {
        throw new ApiError(404, "No subjects found");
    }

    const formattedFacultySubject = facultySubject.map((fs) => ({
        _id: fs._id,
        class_year: fs.class_id.year,
        class_name: fs.class_id.name,
        batch_code: fs.batch_code,
        formType: fs.formType,
        department: fs.class_id.dept.code,
        subject: fs.subject?.name
    }))

    return res.status(200).json(
        new ApiResponse(200, formattedFacultySubject, "successfully fetched classess")
    );
});

export const getDepartments = asyncHandler(async (req, res) => {

    const departments = await Department.find();

    if (!departments) {
        throw new ApiError(404, "No department found");
    }

    return res.status(200).json(
        new ApiResponse(200, departments, "successfully fetched departments")
    );
});

export const getFormById = asyncHandler(async (req, res) => {
    const { form_id } = req.params;

    if (!form_id) {
        throw new ApiError(400, "form_id is required");
    }

    const form = await Form.findById(form_id)
        .populate("questions", "questionText")
        .populate("facultySubject", "_id")
        .lean();

    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    const formattedForm = {
        ...form,
        facultySubject: form.facultySubject.map((fs) => fs._id)
    };

    return res.status(200).json(
        new ApiResponse(200, formattedForm, "Form fetched successfully")
    );
});

export const updateForm = asyncHandler(async (req, res) => {
    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "FormId is required");
    }

    let creator;
    if (req.user.role === "faculty") {
        creator = await Faculty.findOne({ user_id: req.user._id });
        if (!creator) {
            throw new ApiError(404, "Faculty not found");
        }
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    let {
        title,
        questions = [],
        existingQuestionIds = [],
        deadline,
        startDate,
        ratingConfig,
        facultySubject = [],
        dept = []
    } = req.body;

    if ([title, deadline, startDate]
        .some((field) => !field || field.trim() === "")) {
        throw new ApiError(403, "All fields are required");
    }

    if (!ratingConfig || ratingConfig.min === null || ratingConfig.max === null) {
        throw new ApiError(403, "Invalid ratings");
    };

    if (!Array.isArray(existingQuestionIds)) {
        throw new ApiError(403, "Question IDs must be an array");
    }

    const foundQuestions = await Question.find(
        { _id: { $in: existingQuestionIds } },
        { _id: 1 }
    );

    if (foundQuestions.length !== existingQuestionIds.length) {
        throw new ApiError(403, "One or more question IDs are invalid");
    }

    let createdQuestions = [];

    const formattedQuestions = questions.map(q => {
        if (!q || typeof q !== "string" || !q.trim()) {
            throw new ApiError(403, "Question text is required");
        }
        return { questionText: q.trim() };
    });

    if (formattedQuestions.length > 0) {
        createdQuestions = await Question.insertMany(formattedQuestions);
        if (createdQuestions.length === 0) {
            throw new ApiError(500, "Failed to create new questions");
        }
    };

    existingQuestionIds = existingQuestionIds.concat(createdQuestions.map((q) => q._id));

    const updatedFormObj = {
        title,
        deadline,
        startDate,
        questions: existingQuestionIds,
        ratingConfig: ratingConfig,
    }

    if (form.targetType === "CLASS") {
        updatedFormObj.facultySubject = facultySubject;
    } else if (form.targetType === "DEPARTMENT") {
        if (req.user.role === "faculty") {
            if (!creator?.dept) {
                throw new ApiError(400, "Faculty department not found");
            }
            updatedFormObj.dept = [creator.dept];
        } else if (req.user.role === "admin") {
            if (!dept || dept.length === 0) {
                throw new ApiError(400, "Department is required");
            }
            updatedFormObj.dept = dept;
        } else {
            throw new ApiError(403, "Unauthorized to create department form");
        }
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

export const getAccessibleForms = asyncHandler(async (req, res) => {

    const user_id = req?.user?._id;
    const user_role = req?.user?.role;
    let creator;
    if (user_role === "faculty") {
        creator = await Faculty.findOne({ user_id: user_id });
        if (!creator) {
            throw new ApiError(404, "Faculty not found");
        }
    } else if (user_role === "admin") {
        creator = await Admin.findOne({ user_id: user_id });
        if (!creator) {
            throw new ApiError(404, "Admin not found");
        }
    } else {
        throw new ApiError(403, "Unauthorized role");
    }

    const obj = {
        $or: [
            {
                targetType: "CLASS",
                createdBy: new mongoose.Types.ObjectId(user_id)
            },
        ]
    }

    if (user_role === "admin") {
        obj.$or = [
            ...obj.$or,
            {
                targetType: "DEPARTMENT",
                createdBy: user_id
            },
            {
                targetType: "INSTITUTE",
            }
        ]
    } else if (user_role === "faculty") {
        obj.$or = [
            ...obj.$or,
            {
                targetType: "DEPARTMENT",
                dept: creator.dept
            },
            {
                targetType: "INSTITUTE",
            }
        ]
    }

    const forms = await Form.aggregate([
        {
            $match: obj
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
                startDate: 1,
                formType: 1,
                responseCount: "$uniqueStudents",
                createdAt: 1,
                createdBy: 1,
                targetType: 1,
            }
        },
        {
            $sort: { deadline: 1 }
        }
    ]);

    if (!forms.length) {
        throw new ApiError(404, "Forms not found");
    };

    return res.status(200).json(
        new ApiResponse(200, forms, "successfully fetched forms")
    );
});