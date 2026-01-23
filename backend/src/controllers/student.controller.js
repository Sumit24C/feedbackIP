import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"
import { Student } from "../models/student.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js"
import { resolveBatchCodes, resolveBatchCodeByType } from "../utils/student.utils.js"
import { ElectiveEnrollment } from "../models/elective_enrollment.model.js"
import { redisClient } from "../db/redisConfig.js"
import { FORM_CACHE_TTL } from "../constants.js"

export const getFormById = asyncHandler(async (req, res) => {
    const { form_id, fs_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    };

    const [form, student] = await Promise.all([
        Form.findById(form_id).populate("questions"),
        Student
            .findOne({ user_id: req.user._id })
            .populate({
                path: "class_id",
                select: "batches dept",
            }),
    ]);

    if (!form) {
        throw new ApiError(404, "Form not found");
    };

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    if (!student?.class_id) {
        throw new ApiError(400, "Student class not assigned");
    }

    if (form.targetType === "DEPARTMENT" && !form.dept.includes(student.class_id.dept)) {
        throw new ApiError(404, "Department not found");
    }

    const existingResponse = await Response.findOne({ student: student._id, form: form._id });
    if (existingResponse) {
        throw new ApiError(409, "Response already submitted");
    }

    const today = new Date();
    if (new Date(form.deadline).getTime() < Date.now()) {
        throw new ApiError(409, "Form is expired");
    };

    const cacheKey = `form:${form._id}:user:${req.user._id}`;
    const cachedForm = await redisClient.json.get(cacheKey);
    if (cachedForm) {
        return res.status(200).json(
            new ApiResponse(200, cachedForm, "successfully fetched form")
        );
    }

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
            _id: student.class_id.dept
        }];
        try {
            await redisClient.json.set(cacheKey, '.', payload);
            await redisClient.expire(cacheKey, FORM_CACHE_TTL);
        } catch (error) {
            // console.warn("Redis cache failed:", error.message);
        }

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
    try {
        await redisClient.json.set(cacheKey, '.', payload);
        await redisClient.expire(cacheKey, FORM_CACHE_TTL);
    } catch (err) {
        // console.warn("Redis cache failed:", err.message);
    }

    return res.status(200).json(
        new ApiResponse(200, payload, "successfully fetched form")
    );
});

export const getForms = asyncHandler(async (req, res) => {

    const cacheKey = `forms:user:${req.user._id}`;

    const cachedForms = await redisClient.json.get(cacheKey);
    if (cachedForms) {
        console.log("cached")
        return res.status(200).json({
            success: true,
            message: "Forms fetched successfully",
            data: cachedForms
        });
    }

    const student = await Student.findOne({ user_id: req.user._id }).populate("class_id", "batches dept");
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    if (!student?.class_id) {
        throw new ApiError(400, "Student class not assigned");
    }

    const batchMap = resolveBatchCodes(
        student.class_id?.batches,
        student.roll_no
    );

    const [
        coreFacultySubjects,
        electiveEnrollments,
        submittedForms
    ] = await Promise.all([
        FacultySubject.find({
            class_id: student.class_id._id,
            $or: [{ formType: "theory" }, ...batchMap],
        }).populate({
            path: "subject",
            match: { type: "dept" },
            select: "name type"
        }).lean(),

        ElectiveEnrollment.find({
            student: student._id
        }).populate({
            path: "facultySubject",
            select: "facultyName"
        }).lean(),

        Response.find({ student: student._id }).lean(),
    ]);

    const electiveFacultySubjects = electiveEnrollments
        .map(e => e.facultySubject)
        .filter(Boolean);

    const studentFacultySubjects = [
        ...coreFacultySubjects,
        ...electiveFacultySubjects
    ];

    const studentFacultySubjectIds = studentFacultySubjects.map((fs) => fs._id);

    const forms = await Form.find({
        startDate: { $lte: new Date() },
        $or: [
            {
                targetType: "CLASS",
                facultySubject: { $in: studentFacultySubjectIds },
            },
            {
                targetType: "DEPARTMENT",
                dept: student.class_id.dept,
            },
            { targetType: "INSTITUTE" }
        ],
    })
        .select("title deadline startDate formType targetType facultySubject dept")
        .sort({ deadline: 1 })
        .lean();

    if (forms.length === 0) {
        throw new ApiError(404, "Forms not found");
    }

    const facultySubjectMap = new Map(
        studentFacultySubjects.map(fs => [fs._id.toString(), fs])
    );

    const submittedFormIds = new Set(submittedForms.map(r => r.form.toString()));

    const payload = forms.map(form => {
        let matchedFacultySubjects = null;
        if (form.targetType === "CLASS") {
            for (const fsId of form.facultySubject) {
                const fs = facultySubjectMap.get(fsId.toString());
                if (fs) {
                    matchedFacultySubjects = fs;
                    break;
                }
            }
        }

        const payload = {
            formId: form._id,
            title: form.title,
            deadline: form.deadline,
            startDate: form.startDate,
            formType: form.formType,
            targetType: form.targetType,
            status: submittedFormIds.has(form._id.toString())
                ? "submitted"
                : "pending"
        };

        if (form.formType === "infrastructure") {
            payload.facultySubjectId = student.class_id.dept
            payload.facultyName = null
        } else {
            payload.facultySubjectId = matchedFacultySubjects?._id || null
            payload.facultyName = matchedFacultySubjects?.facultyName || null
        }

        return payload
    });

    try {
        await redisClient.json.set(cacheKey, '.', payload);
        await redisClient.expire(cacheKey, FORM_CACHE_TTL);
    } catch (error) {
        // console.warn("Redis cache failed:", error.message);
    }

    return res.status(200).json({
        success: true,
        message: "Forms fetched successfully",
        data: payload
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

    const student = await Student.findOne({ user_id: req.user._id }).populate("class_id", "dept");
    if (!student) {
        throw new ApiError(404, "Student not found");
    }
    if (form.targetType === "DEPARTMENT" && !form.dept.includes(student.class_id.dept)) {
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
        dept: student.class_id.dept,
        form: form._id,
        student: student._id,
        facultySubject: new mongoose.Types.ObjectId(response._id),
        ratings: response.ratings,
    }));

    const savedResponses = await Response.insertMany(responseDocs);
    if (!savedResponses) {
        throw new ApiError(500, "Failed to submit response");
    }

    try {
        await redisClient.del(`form:${form._id}:user:${req.user._id}`);
        await redisClient.del(`forms:user:${req.user._id}`);
    } catch (error) {
        // console.warn("Redis cache invalidation failed:", error.message);
    }

    return res.status(200).json(
        new ApiResponse(200, savedResponses, "successfully submitted response")
    )
});