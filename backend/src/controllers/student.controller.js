import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"
import { Student } from "../models/student.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js"
import { Subject } from "../models/subject.model.js"
import { getClassSection, getStudentYear } from "../utils/student.utils.js"

export const getFormById = asyncHandler(async (req, res) => {
    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    };

    const form = await Form.findById(form_id).populate("questions");
    if (!form) {
        throw new ApiError(404, "Form not found");
    };
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    if (form.targetType === "DEPARTMENT" && !form.dept.includes(student.dept)) {
        return res.status(200).json(
            new ApiResponse(200, {}, "Not your department")
        );
    }

    const studentClassSection = getClassSection(student, form.formType);
    const studentYear = getStudentYear(student);
    const existingResponse = await Response.findOne({ student: req.user._id, form: form._id });
    if (existingResponse) {
        throw new ApiError(409, "Response already submitted");
    }

    const today = new Date();
    if (form.deadline < today) {
        return res.status(200).json(
            new ApiResponse(200, {}, "Form is expired")
        );
    };

    let facultySubjects = [];
    if (form.targetType === "DEPARTMENT") {
        facultySubjects = await FacultySubject.aggregate([
            {
                $match: {
                    classDepartment: student.dept,
                    classSection: studentClassSection.trim(),
                    formType: form.formType,
                    classYear: studentYear,
                }
            },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subject",
                    foreignField: "_id",
                    as: "subject",
                    pipeline: [
                        {
                            $project: {
                                dept: 1,
                                name: 1,
                                subject_code: 1,
                                type: 1,
                            }
                        }
                    ]
                }
            },
            { $unwind: "$subject" },
            {
                $lookup: {
                    from: "faculties",
                    localField: "faculty",
                    foreignField: "_id",
                    as: "facultyData",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "user_id",
                                foreignField: "_id",
                                as: "user",
                                pipeline: [
                                    {
                                        $project: {
                                            email: 1,
                                            fullname: 1
                                        }
                                    },
                                ]
                            }
                        }
                    ]
                }
            },
            { $unwind: "$facultyData" },
            { $unwind: "$facultyData.user" },
            {
                $project: {
                    facultyId: "$facultyData._id",
                    facultyName: "$facultyData.user.fullname",
                    subject: 1,
                    classYear: 1,
                    classSection: 1,
                }
            }
        ]);
    } else {
        const facultySubjectId = form.facultySubject[0]
        const fs = await FacultySubject.findById(facultySubjectId)
            .populate({
                path: "faculty",
                select: "_id user_id",
                populate: {
                    path: "user_id",
                    select: "fullname"
                }
            })
            .populate("subject")
            .select("subject classSection classYear faculty")
            .lean();

        facultySubjects = [{
            _id: facultySubjectId,
            facultyId: fs.faculty?._id,
            facultyName: fs.faculty?.user_id?.fullname,
            subject: fs.subject,
            classYear: fs.classYear,
            classSection: fs.classSection
        }];
    }

    if (!facultySubjects || facultySubjects.length === 0) {
        throw new ApiError(500, "No faculty subjects found for this form");
    }

    const payload = {
        formId: form._id,
        title: form.title,
        deadline: form.deadline,
        formType: form.formType,
        ratingConfig: form.ratingConfig,
        questions: form.questions.map(q => ({
            questionId: q._id,
            text: q.questionText,
            type: q.questionType
        })),
        facultySubjects: facultySubjects,
    };

    return res.status(200).json(
        new ApiResponse(200, payload, "successfully fetched form")
    );
});

export const getForms = asyncHandler(async (req, res) => {

    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const baseSection = getClassSection(student);
    const studentYear = getStudentYear(student);

    const facultySubjects = await FacultySubject.find({
        classSection: { $in: [baseSection, student.classSection] },
        classDepartment: student.dept,
        classYear: studentYear
    }).select("_id");

    const facultySubjectIds = facultySubjects.map((fs) => fs._id);

    const forms = await Form.find({
        $or: [
            {
                targetType: "CLASS",
                facultySubject: { $in: facultySubjectIds }
            },
            {
                targetType: "DEPARTMENT",
                dept: student.dept
            }
        ]
    }).lean();

    if (forms.length === 0) {
        throw new ApiError(404, "Forms not found");
    }

    const submittedForms = await Response.find({ student: student._id }).lean();
    const submittedFormIds = submittedForms.map(r => r.form.toString());

    const result = forms.map(form => ({
        formId: form._id,
        title: form.title,
        deadline: form.deadline,
        formType: form.formType,
        status: submittedFormIds.includes(form._id.toString()) ? 'submitted' : 'pending'
    }));

    res.status(200).json({
        success: true,
        message: "Forms fetched successfully",
        data: result
    });
});

export const submitResponse = asyncHandler(async (req, res) => {
    const { form_id } = req.params;
    const facultySubjectResponse = req.body;
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
    if (form.targetType === "DEPARTMENT" && !form.dept.includes(student.dept)) {
        return res.status(200).json(
            new ApiResponse(200, {}, "Not your department")
        );
    }

    const existingResponse = await Response.findOne({ student: student._id, form: form._id });
    if (existingResponse) {
        throw new ApiError(409, "Response already submitted");
    }

    const today = new Date();
    if (form.deadline < today) {
        return res.status(200).json(
            new ApiResponse(200, {}, "Form is expired")
        );
    };

    const responseDocs = facultySubjectResponse.map((fs) => ({
        dept: student.dept,
        form: form._id,
        student: student._id,
        facultySubject: fs._id,
        ratings: fs.ratings,
    }));

    const savedResponses = await Response.insertMany(responseDocs);
    if (!savedResponses) {
        throw new ApiError(500, "Failed to submit response");
    }

    return res.status(200).json(
        new ApiResponse(200, savedResponses, "successfully submitted response")
    )
});