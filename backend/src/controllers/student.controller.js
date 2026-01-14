import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"
import { Student } from "../models/student.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js"
import { getClassSection, getStudentYear, resolveBatchCodes, resolveBatchCodeByType } from "../utils/student.utils.js"
import { ElectiveEnrollment } from "../models/elective_enrollment.model.js"

export const getFormById = asyncHandler(async (req, res) => {
    const { form_id, fs_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    };

    const form = await Form.findById(form_id).populate("questions");
    if (!form) {
        throw new ApiError(404, "Form not found");
    };

    const student = await Student
        .findOne({ user_id: req.user._id })
        .populate("dept", "name")
        .populate("class_id", "batches");

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    if (form.targetType === "DEPARTMENT" && !form.dept.includes(student.dept._id)) {
        throw new ApiError(404, "Department not found");
    }

    const existingResponse = await Response.findOne({ student: req.user._id, form: form._id });
    if (existingResponse) {
        throw new ApiError(409, "Response already submitted");
    }

    const today = new Date();
    if (form.deadline < today) {
        throw new ApiError(409, "Form is expired");
    };

    const payload = {
        formId: form._id,
        title: form.title,
        deadline: form.deadline,
        startDate: form.startDate,
        formType: form.formType,
        ratingConfig: form.ratingConfig,
        questions: form.questions.map(q => ({
            questionId: q._id,
            text: q.questionText,
            type: q.questionType
        })),
    };

    if (form.formType === "infrastructure") {
        payload.entities = [{
            _id: student.dept._id
        }];
        return res.status(200).json(
            new ApiResponse(200, payload, "successfully fetched form")
        );
    }

    const query = {
        class_id: student.class_id._id,
        formType: form.formType,
    };

    if (form.formType !== "theory") {
        query.batch_code = resolveBatchCodeByType(
            student.class_id.batches,
            student.roll_no,
            form.formType
        );
    }

    let entities = [];
    if (form.targetType === "DEPARTMENT") {
        const coreFacultySubjects = await FacultySubject.find(query)
            .populate({
                path: "faculty",
                select: "_id user_id",
                populate: {
                    path: "user_id",
                    select: "fullname"
                }
            }).populate("class_id", "name")
            .populate("subject", "name")
            .lean();

        const electiveEnrollments = await ElectiveEnrollment.find({
            student: student._id
        }).populate({
            path: "facultySubject",
            populate: [
                {
                    path: "faculty",
                    select: "user_id",
                    populate: {
                        path: "user_id",
                        select: "fullname"
                    }
                },
                {
                    path: "subject",
                    select: "name type"
                },
                {
                    path: "class_id",
                    select: "name"
                }
            ]
        }).lean();

        const electiveFacultySubjects = electiveEnrollments
            .map(e => e.facultySubject)
            .filter(Boolean);

        const facultySubjects = [
            ...coreFacultySubjects,
            ...electiveFacultySubjects
        ];

        entities = facultySubjects.map((fs) => ({
            _id: fs._id,
            facultyId: fs.faculty?._id,
            facultyName: fs.faculty?.user_id?.fullname,
            subject: fs.subject.name,
            batch_code: fs.subject.type === "elective" ? null : fs.batch_code,
        }));

    } else {

        const fs = await FacultySubject.findById(fs_id)
            .populate({
                path: "faculty",
                select: "_id user_id",
                populate: {
                    path: "user_id",
                    select: "fullname"
                }
            })
            .populate("class_id", "name")
            .populate("subject", "name type")
            .lean();

        if (!fs) {
            throw new ApiError(404, "FacultySubject not found");
        }
        const isElective = fs.subject.type === "elective"
        if (isElective) {
            const enrolled = await ElectiveEnrollment.exists({
                student: student._id,
                facultySubject: fs._id
            });
            if (!enrolled) {
                throw new ApiError(403, "You are not enrolled in this elective");
            }
        }

        entities = [{
            _id: fs_id,
            facultyId: fs.faculty?._id,
            facultyName: fs.faculty?.user_id?.fullname,
            subject: fs.subject.name,
            batch_code: !isElective ? fs?.batch_code : null,
            class_name: !isElective ? fs?.class_id?.name : student?.class_id?.name,
        }];
    }

    if (!entities || entities.length === 0) {
        throw new ApiError(500, "No faculty subjects found for this form");
    }

    payload.entities = entities;

    return res.status(200).json(
        new ApiResponse(200, payload, "successfully fetched form")
    );
});

export const getForms = asyncHandler(async (req, res) => {

    const student = await Student.findOne({ user_id: req.user._id }).populate("dept", "name").populate("class_id", "batches");
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const batchMap = resolveBatchCodes(
        student.class_id.batches,
        student.roll_no
    );

    const coreFacultySubjects = await FacultySubject.find({
        class_id: student.class_id._id,
        $or: [{ formType: "theory" }, ...batchMap],
    }).populate({
        path: "subject",
        match: { type: "dept" },
        select: "name type"
    }).populate({
        path: "faculty",
        select: "user_id",
        populate: { path: "user_id", select: "fullname" }
    });

    const electiveEnrollments = await ElectiveEnrollment.find({
        student: student._id
    }).populate({
        path: "facultySubject",
        populate: {
            path: "faculty",
            select: "user_id",
            populate: { path: "user_id", select: "fullname" }
        }
    });

    const electiveFacultySubjects = electiveEnrollments
        .map(e => e.facultySubject)
        .filter(Boolean);

    const studentFacultySubjects = [
        ...coreFacultySubjects,
        ...electiveFacultySubjects
    ];

    const studentFacultySubjectIds = studentFacultySubjects.map((fs) => fs._id.toString());

    const forms = await Form.find({
        $or: [
            {
                targetType: "CLASS",
                facultySubject: { $in: studentFacultySubjectIds },
                startDate: { $lte: new Date().toISOString() }
            },
            {
                targetType: "DEPARTMENT",
                dept: student.dept?._id,
                startDate: { $lte: new Date().toISOString() }
            },
            {
                targetType: "INSTITUTE",
                startDate: { $lte: new Date().toISOString() }
            }
        ],
    }).lean().sort({ deadline: 1 });

    if (forms.length === 0) {
        throw new ApiError(404, "Forms not found");
    }

    const submittedForms = await Response.find({ student: student._id }).lean();
    const submittedFormIds = submittedForms.map(r => r.form.toString());

    const result = forms.map(form => {
        let matchedFacultySubjects = null;

        if (form.targetType === "CLASS") {
            matchedFacultySubjects = studentFacultySubjects.find(fs =>
                form.facultySubject
                    .map(id => id.toString())
                    .includes(fs._id.toString())
            );
        }

        const payload = {
            formId: form._id,
            title: form.title,
            deadline: form.deadline,
            startDate: form.startDate,
            formType: form.formType,
            targetType: form.targetType,
            status: submittedFormIds.includes(form._id.toString())
                ? "submitted"
                : "pending"
        };

        if (form.formType === "infrastructure") {
            payload.facultySubjectId = student.dept._id
            payload.facultyName = student.dept.name
        } else {
            payload.facultyName = matchedFacultySubjects?.faculty?.user_id?.fullname || null
            payload.facultySubjectId = matchedFacultySubjects?._id || null
        }

        return payload
    });

    res.status(200).json({
        success: true,
        message: "Forms fetched successfully",
        data: result
    });
});

export const submitResponse = asyncHandler(async (req, res) => {
    const { form_id } = req.params;
    const studentResponses = req.body;
    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    };

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    };

    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
        throw new ApiError(404, "Student not found");
    }
    if (form.targetType === "DEPARTMENT" && !form.dept.includes(student.dept._id)) {
        throw new ApiError(404, "Not your Department");
    }

    const existingResponse = await Response.findOne({ student: student._id, form: form._id });
    if (existingResponse) {
        throw new ApiError(409, "Response already submitted");
    }

    const today = new Date();
    if (form.deadline < today) {
        throw new ApiError(409, "Form is expired");
    };

    const responseDocs = studentResponses.map((response) => ({
        dept: student.dept,
        form: form._id,
        student: student._id,
        facultySubject: new mongoose.Types.ObjectId(response._id),
        ratings: response.ratings,
    }));

    const savedResponses = await Response.insertMany(responseDocs);
    if (!savedResponses) {
        throw new ApiError(500, "Failed to submit response");
    }

    return res.status(200).json(
        new ApiResponse(200, savedResponses, "successfully submitted response")
    )
});