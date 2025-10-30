import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"
import { Faculty } from "../models/faculty.model.js"
import { Student } from "../models/student.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js"
import { getStudentYear } from "../utils/getStudentYear.js"

export const getFormById = asyncHandler(async (req, res) => {
    // Input: form_id, student_id,subjectMappingId, responses: [{q_id: answer}}]
    // 1. Validate form exists and is active
    // 2. Validate student exists
    // 3. Check if student already submitted for same subjectMappingId
    // 4. Create Response documents for each subjectMappingId
    // 5. Return success message

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
    if (student.dept.toString() !== form.dept.toString()) {
        throw new ApiError(403, "Student doesn't belong to the department");
    }

    let studentClassSection = student.classSection;
    if (form.formType === "practical") {
        studentClassSection = student.roll_no <= 36 ? `${studentClassSection}1` : `${studentClassSection}2`;
    }

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
    const studentYear = getStudentYear(student);
    console.log(studentYear);
    console.log(form.dept);
    console.log(form.formType);
    console.log(studentClassSection);
    const facultiesSubject = await FacultySubject.aggregate([
        {
            $match: {
                dept: new mongoose.Types.ObjectId(form.dept),
                classSection: studentClassSection,
                formType: form.formType,
                year: studentYear
            }
        },
        {
            $lookup: {
                from: "faculties",
                localField: "faculty",
                foreignField: "_id",
                as: "facultyData"
            }
        },
        { $unwind: "$facultyData" },
        {
            $lookup: {
                from: "users",
                localField: "facultyData.user_id",
                foreignField: "_id",
                as: "userData"
            }
        },
        { $unwind: "$userData" },
        {
            $project: {
                subject: 1,
                classSection: 1,
                formType: 1,
                year: 1,
                facultyId: "$facultyData._id",
                facultyName: "$userData.fullname"
            }
        }
    ]);

    console.log("faculty", facultiesSubject);
    if (!facultiesSubject || facultiesSubject.length === 0) {
        throw new ApiError(500, "No faculty subjects found for this form");
    }

    const payload = {
        formId: form._id,
        title: form.title,
        deadline: form.deadline,
        formType: form.formType,
        questions: form.questions.map(q => ({
            questionId: q._id,
            text: q.questionText,
            type: q.questionType
        })),
        subjects: facultiesSubject.map(s => ({
            subjectMappingId: s._id,
            subject: s.subject,
            classSection: s.classSection,
            year: s.year,
            facultyId: s.facultyId,
            facultyName: s.facultyName,
        })),
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

    const forms = await Form.find({ dept: student.dept }).lean();
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
    // Input: form_id, student_id,subjectMappingId, responses: [{q_id: answer}}]
    // 1. Validate form exists and is active
    // 2. Validate student exists
    // 3. Check if student already submitted for same subjectMappingId
    // 4. Create Response documents for each subjectMappingId
    // 5. Return success message

    const { form_id } = req.params;
    const { subjects } = req.body;

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
    if (student.dept.toString() !== form.dept.toString()) {
        throw new ApiError(403, "Student doesn't belong to the department");
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

    const responseDocs = subjects.map((s) => ({
        dept: student.dept,
        form: form._id,
        student: student._id,
        subjectMapping: s.subjectMappingId,
        responses: s.responses,
    }));

    const savedResponses = await Response.insertMany(responseDocs);
    if (!savedResponses) {
        throw new ApiError(500, "Failed to submit response");
    }

    return res.status(200).json(
        new ApiResponse(200, savedResponses, "successfully submitted response")
    )
});