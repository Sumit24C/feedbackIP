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
import { getCurrentSemester } from "../utils/subject.utils.js"

const CURRENT_SEMESTER = getCurrentSemester();

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
                from: "classsections",
                localField: "class_id",
                foreignField: "_id",
                as: "class_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "departments",
                            localField: "dept",
                            foreignField: "_id",
                            as: "department",
                            pipeline: [
                                {
                                    $project: {
                                        code: 1
                                    }
                                }
                            ]
                        }
                    },
                    { $unwind: "$department" },
                    {
                        $project: {
                            name: 1,
                            year: 1,
                            department: "$department.code"
                        }
                    }
                ]
            }
        },
        { $unwind: "$class_id" },
        {
            $lookup: {
                from: "subjects",
                localField: "subject",
                foreignField: "_id",
                as: "subject",
                pipeline: [
                    {
                        $match: {
                            semester: CURRENT_SEMESTER
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            subject_code: 1
                        }
                    }
                ]
            }
        },
        { $unwind: { path: "$subject", preserveNullAndEmptyArrays: false } },
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
                class_name: "$class_id.name",
                class_year: "$class_id.year",
                batch_code: 1,
                department: "$class_id.department",
                subject: "$subject.subject_code",
                totalResponses: 1
            }
        }
    ]);

    console.log(subjectMappings)
    if (subjectMappings.length === 0) {
        throw new ApiError(404, "No Subjects found");
    }

    return res.status(200).json(
        new ApiResponse(200, subjectMappings, "successfully fetched subjects mapping")
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

    const classSections = await Student.aggregate([
        {
            $match: {
                dept: faculty.dept
            }
        },
        {
            $lookup: {
                from: "classsections",
                localField: "class_id",
                foreignField: "_id",
                as: "class_id",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            year: 1,
                        }
                    }
                ]
            }
        },
        { $unwind: "$class_id" },
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
                _id: "$class_id._id",
                class_name: { $first: "$class_id.name" },
                class_year: { $first: "$class_id.year" },
                totalResponses: { $sum: "$totalResponses" }
            }
        },
        {
            $project: {
                class_name: 1,
                class_year: 1,
                totalResponses: 1
            }
        },
        {
            $sort: {
                class_year: 1,
                class_name: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, classSections, "Class sections fetched successfully")
    );
});

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
        const facultySubjects = await FacultySubject.find({ faculty: faculty._id }).select("_id");
        facultySubjectIds = facultySubjects.map((fs) => fs._id);
        overallSummary = await Response.aggregate([
            {
                $match: {
                    form: new mongoose.Types.ObjectId(form_id),
                    facultySubject: { $in: facultySubjectIds },
                },
            },
            {
                $lookup: {
                    from: "facultysubjects",
                    localField: "facultySubject",
                    foreignField: "_id",
                    as: "facultySubject",
                    pipeline: [
                        {
                            $lookup: {
                                from: "classsections",
                                localField: "class_id",
                                foreignField: "_id",
                                as: "classSection",
                                pipeline: [
                                    {
                                        $project: { name: 1, year: 1 }
                                    }
                                ]
                            }
                        },
                        { $unwind: "$classSection" },
                        {
                            $project: {
                                class_id: "$classSection._id",
                                class_name: "$classSection.name",
                                class_year: "$classSection.year",
                                batch_code: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: "$facultySubject" },
            { $unwind: "$ratings" },
            {
                $addFields: {
                    ratingValue: {
                        $convert: {
                            input: "$ratings.answer",
                            to: "double",
                            onError: null,
                            onNull: null,
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        class_id: "$facultySubject.class_id",
                        student: "$student",
                    },
                    class_name: { $first: "$facultySubject.class_name" },
                    class_year: { $first: "$facultySubject.class_year" },
                    batch_code: { $first: "$facultySubject.batch_code" },
                    avgRatingPerStudent: { $avg: "$ratingValue" },
                },
            },
            {
                $group: {
                    _id: {
                        class_id: "$_id.class_id",
                    },
                    class_name: { $first: "$class_name" },
                    class_year: { $first: "$class_year" },
                    batch_code: { $first: "$batch_code" },
                    totalResponses: { $sum: 1 },
                    avgRating: { $avg: "$avgRatingPerStudent" },
                },
            },
            {
                $project: {
                    _id: 0,
                    class_name: 1,
                    class_year: 1,
                    batch_code: 1,
                    totalResponses: 1,
                    avgRating: { $round: ["$avgRating", 2] },
                },
            },
            {
                $sort: {
                    class_year: 1,
                    class_name: 1,
                },
            },
        ]);
    } else {
        overallSummary = await Response.aggregate([
            {
                $match: {
                    dept: faculty.dept._id,
                    form: new mongoose.Types.ObjectId(form_id)
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
                $lookup: {
                    from: "classsections",
                    localField: "student.class_id",
                    foreignField: "_id",
                    as: "classSection",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                year: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: "$classSection" },
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
                        class_id: "$classSection._id",
                        student: "$student._id"
                    },
                    class_name: { $first: "$classSection.name" },
                    class_year: { $first: "$classSection.year" },
                    avgRatingPerStudent: { $avg: "$ratingValue" }
                }
            },
            {
                $group: {
                    _id: "$_id.class_id",
                    class_name: { $first: "$class_name" },
                    class_year: { $first: "$class_year" },
                    totalResponses: { $sum: 1 },
                    avgRating: { $avg: "$avgRatingPerStudent" }
                }
            },
            {
                $project: {
                    _id: 0,
                    class_name: 1,
                    class_year: 1,
                    totalResponses: 1,
                    avgRating: { $round: ["$avgRating", 2] }
                }
            },
            {
                $sort: {
                    class_year: 1,
                    class_name: 1
                }
            }
        ]);
    }

    return res.status(200).json(
        new ApiResponse(200, overallSummary.length > 0 ? overallSummary : [], "successfully fetched overall summary")
    );
});

export const getFeedbackResultBySubjects = asyncHandler(async (req, res) => {
    const { form_id, fs_id } = req.params;

    if (!form_id) {
        throw new ApiError(403, "Form Id is required");
    }
    if (!fs_id) {
        throw new ApiError(403, "facultySubjectId is required");
    }

    const form = await Form.findById(form_id);
    if (!form) {
        throw new ApiError(404, "Form not found");
    }
    const subjectMapping = await FacultySubject.findById(fs_id);
    if (!subjectMapping) {
        throw new ApiError(404, "subjectMapping not found");
    }

    const subjectQuestionSummary = await Response.aggregate([
        {
            $match: {
                form: new mongoose.Types.ObjectId(form_id),
                facultySubject: new mongoose.Types.ObjectId(fs_id),
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

export const getFeedbackResultByClass = asyncHandler(async (req, res) => {
    const { form_id, class_id } = req.params;

    if (!form_id || !class_id) {
        throw new ApiError(403, "FormId and ClassId are required");
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
                class_id: new mongoose.Types.ObjectId(class_id),
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

    return res.status(200).json(
        new ApiResponse(
            200,
            summary.length > 0 ? summary : [],
            "successfully fetched question summary"
        )
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
