import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Form } from "../models/form.model.js"
import { Response } from "../models/response.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js"
import { Faculty } from "../models/faculty.model.js"
import { getStudentAcademicYear, getStudentYear } from "../utils/student.utils.js"
import { Student } from "../models/student.model.js"

export const getOverallFeedbackResult = asyncHandler(async (req, res) => {

    const { form_id } = req.params;
    if (!form_id) {
        throw new ApiError(400, "Form Id is required");
    };

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    };

    const faculty = await Faculty.findOne({ user_id: req?.user?._id }).populate("dept", "name");

    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }
    let facultySubjectIds;
    let overallSummary = [];
    if (form.formType !== "infrastructure") {
        const facultySubjects = await FacultySubject.find({ faculty: faculty._id });
        facultySubjectIds = facultySubjects.map((fs) => fs._id);
        overallSummary = await Response.aggregate([
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
                    ratingValue: {
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
                    _id: {
                        classSection: "$facultySubjectData.classSection",
                        classYear: "$facultySubjectData.classYear",
                        student: "$student"
                    },
                    avgRatingPerStudent: { $avg: "$ratingValue" }
                }
            },
            {
                $group: {
                    _id: {
                        classSection: "$_id.classSection",
                        classYear: "$_id.classYear"
                    },
                    totalResponses: { $sum: 1 },
                    avgRating: { $avg: "$avgRatingPerStudent" }
                }
            },
            {
                $project: {
                    _id: 0,
                    classSection: "$_id.classSection",
                    classYear: "$_id.classYear",
                    totalResponses: 1,
                    avgRating: { $round: ["$avgRating", 2] }
                }
            },
            { $sort: { classYear: 1, classSection: 1 } }
        ]);

    } else {
        overallSummary = await Response.aggregate([
            {
                $match: {
                    dept: faculty.dept._id,
                    form: form._id
                }
            },
            { $unwind: "$ratings" },
            {
                $lookup: {
                    from: "students",
                    localField: "student",
                    foreignField: "_id",
                    as: "student"
                }
            },
            { $unwind: "$student" },
            {
                $addFields: {
                    ratingValue: {
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
                    _id: {
                        classSection: "$student.classSection",
                        academic_year: "$student.academic_year"
                    },
                    avgRating: { $avg: "$ratingValue" },
                    totalResponses: { $addToSet: "$student" }
                }
            },
            {
                $addFields: {
                    totalResponses: { $size: "$totalResponses" }
                }
            },
            {
                $project: {
                    classSection: "$_id.classSection",
                    classYear: "$_id.academic_year",
                    avgRating: { $round: ["$avgRating", 2] },
                    totalResponses: 1
                }
            }
        ]);

        overallSummary = overallSummary.map((s) => ({ ...s, classYear: getStudentYear(s.classYear) }))
    }

    if (overallSummary.length === 0) {
        throw new ApiError(500, "Failed to fetch overall summary");
    }

    return res.status(200).json(
        new ApiResponse(200, overallSummary, "successfully fetched overall summary")
    );
});

export const getFeedbackResultBySubjects = asyncHandler(async (req, res) => {
    const { form_id, facultySubjectId } = req.params;

    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    }
    if (!facultySubjectId) {
        throw new ApiError(403, "facultySubjectId is required");
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }
    const subjectMapping = await FacultySubject.findById(facultySubjectId);
    if (!subjectMapping) {
        throw new ApiError(404, "subjectMapping not found");
    }

    const subjectQuestionSummary = await Response.aggregate([
        {
            $match: {
                form: new mongoose.Types.ObjectId(form_id),
                facultySubject: new mongoose.Types.ObjectId(facultySubjectId),
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

    let obj = [];
    if (form.targetType === "CLASS" && form.facultySubject && form.facultySubject.length > 0) {
        obj = {
            _id: { $in: form.facultySubject }
        }
    } else {
        obj = {
            faculty: faculty._id,
            formType: form.formType
        }
    }

    const subjectMappings = await FacultySubject.aggregate([
        {
            $match: obj
        },
        {
            $lookup: {
                from: "departments",
                localField: "classDepartment",
                foreignField: "_id",
                as: "classDepartment",
                pipeline: [
                    {
                        $project: {
                            name: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$classDepartment" },
        {
            $lookup: {
                from: "subjects",
                localField: "subject",
                foreignField: "_id",
                as: "subject",
                pipeline: [
                    {
                        $project: {
                            name: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$subject" },
        {
            $lookup: {
                from: "responses",
                localField: "_id",
                foreignField: "facultySubject",
                as: "responses",
                pipeline: [
                    {
                        $match: {
                            form: form._id
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            form: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalResponses: { $size: "$responses" }
            }
        },
        {
            $project: {
                classSection: 1,
                classDepartment: "$classDepartment.name",
                subject: 1,
                formType: 1,
                totalResponses: 1
            }
        }
    ]);

    if (subjectMappings.length === 0) {
        throw new ApiError(404, "No Subjects found");
    }

    return res.status(200).json(
        new ApiResponse(200, subjectMappings, "successfully fetched subjects mapping")
    );
});

export const getFeedbackResultByClass = asyncHandler(async (req, res) => {
    const { form_id, classSection, classYear } = req.params;

    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    }
    if (!classSection || !classYear) {
        throw new ApiError(403, "classSection and classYear are required");
    }

    const faculty = await Faculty.findOne({ user_id: req?.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    const summary = await Student.aggregate([
        {
            $match: {
                classSection,
                academic_year: getStudentAcademicYear(classYear),
                dept: faculty.dept
            }
        },
        {
            $lookup: {
                from: "responses",
                localField: "_id",
                foreignField: "student",
                as: "responses",
                pipeline: [
                    {
                        $match: {
                            form: form._id
                        }
                    },
                ]
            }
        },
        { $unwind: "$responses" },
        { $unwind: "$responses.ratings" },
        {
            $addFields: {
                numericAnswer: {
                    $convert: {
                        input: "$responses.ratings.answer",
                        to: "double",
                        onError: null,
                        onNull: null
                    }
                }
            }
        },
        {
            $group: {
                _id: "$responses.ratings.questionId",
                avgRating: { $avg: "$numericAnswer" }
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
                _id: 0,
                questionId: "$question._id",
                questionText: "$question.questionText",
                avgRating: { $round: ["$avgRating", 2] }
            }
        }
    ]);

    if (summary.length === 0) {
        throw new ApiError(404, "No feedback found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            summary.length > 0 ? summary : [],
            "successfully fetched question summary"
        )
    );
});

export const getDepartmentClass = asyncHandler(async (req, res) => {
    const faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const { form_id } = req.params;
    const form = await Form.findById(form_id).select("_id");

    if (!form) {
        throw new ApiError(404, "Form not found");
    }

    const matchStage = faculty.dept
        ? { dept: new mongoose.Types.ObjectId(faculty.dept) }
        : {};

    const classSections = await Student.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "responses",
                localField: "_id",
                foreignField: "student",
                as: "responses",
                pipeline: [
                    {
                        $match: {
                            form: form._id
                        }
                    },
                    {
                        $project: {
                            _id: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalResponses: { $size: "$responses" }
            }
        },
        {
            $group: {
                _id: {
                    classSection: "$classSection",
                    academic_year: "$academic_year"
                },
                totalResponses: { $sum: "$totalResponses" }
            }
        },
        {
            $project: {
                _id: 0,
                classSection: "$_id.classSection",
                academic_year: "$_id.academic_year",
                totalResponses: 1
            }
        },
        {
            $sort: {
                academic_year: 1,
                classSection: 1
            }
        }
    ]);

    const payload = classSections.map((cs) => ({
        ...cs,
        classYear: getStudentYear(cs.academic_year),
        formType: "infrastructure",
        _id: getStudentYear(cs.academic_year) + '_' + cs.classSection
    }));

    return res.status(200).json(
        new ApiResponse(200, payload, "Class sections fetched successfully")
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
