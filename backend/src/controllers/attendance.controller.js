import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { FacultySubject } from "../models/faculty_subject.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Student } from "../models/student.model.js";
import { getStudentAcademicYear } from "../utils/getStudentAcademicYear.js";
import mongoose from "mongoose";

export const getClassStudent = asyncHandler(async (req, res) => {
    const faculty = await Faculty.findOne({ user_id: req.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const { classSection, year, dept } = req.body;

    if ([classSection, year, dept].some(
        (field) => !field ||
            ((typeof field === String) && field.trim() === "")
    )) {
        throw new ApiError(401, "classSection, dept, year are required");
    }

    const academic_year = getStudentAcademicYear(year);
    const studentObj = {
        classSection: classSection,
        academic_year: academic_year,
        dept: dept,
    }

    const isPracticalClass = /^[A-D][1-2]$/.test(classSection);

    if (isPracticalClass && year != "FY") {
        const sectionNumber = classSection[1];
        sectionNumber.roll_no = sectionNumber === '1' ?
            { $le: 36 } : { $ge: 37 } // if A1 check student with roll_no <= 36 else > 36
    }

    const students = await Student.find({
        ...studentObj
    });

    if (!studentObj) {
        throw new ApiError(404, "Students not found");
    }

    return res.status(200).json(
        new ApiResponse(200, students, "successfully fetched students")
    );
});

export const getFacultyClassByFacultyId = asyncHandler(async (req, res) => {
    const faculty = await Faculty.findOne({ user_id: req.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const faculySubject = await FacultySubject.find({ faculty: faculty._id });

    if (!faculySubject) {
        throw new ApiError(404, "No class found for this faculty");
    }

    return res.status(200).json(
        new ApiResponse(200, faculySubject, "successfully fetched faculty classess")
    );
});

export const createAttendance = asyncHandler(async (req, res) => {
    const { attendance, faculty_id, subject, classSection, year, dept, createdAt } = req.body;

    const faculty = await Faculty.findOne({ user_id: req.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }
    const { faculty_subject } = req.params;


    // if ([faculty_id, subject, classSection, year, dept].some(
    //     (field) => !field ||
    //         ((typeof field === String) && field.trim() === "")
    // )) {
    //     throw new ApiError(401, "facultyId, subject, classSection, year, dept are required");
    // }

    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
        throw new ApiError(401, "Attendace are required");
    }

    // const facultySubject = await FacultySubject.findOne({
    //     faculty: faculty_id,
    //     classSection,
    //     year,
    //     subject,
    //     dept
    // });

    const facultySubject = await FacultySubject.findById(faculty_subject);

    if (!facultySubject) {
        throw new ApiError(404, "faculty with this details not found");
    }

    const attendance_obj = {
        facultySubject: facultySubject,
        students: attendance,
    }

    if (createdAt && !(isNaN(new Date(createdAt)))) {
        attendance_obj["createdAt"] = new Date(createdAt);
    }

    const attendance_record = await Attendance.create({
        ...attendance_obj
    })

    if (!attendance_record) {
        throw new ApiError(500, "Failed to add attendance session");
    }

    return res.status(200).json(
        new ApiResponse(200, attendance_record, "successfully created attendance_record")
    );
});

//students routes
export const getStudentAttendanceByStudentId = asyncHandler(async (req, res) => {

    const student = await Student.findOne({ user_id: req.user?._id })
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const attendance = await Attendance.aggregate([
        { $unwind: "$students" },
        {
            $match: {
                "students.student": student._id
            }
        },
        {
            $lookup: {
                from: "facultysubjects",
                localField: "facultySubject",
                foreignField: "_id",
                as: "facultySubject",
            }
        },
        { $unwind: "$facultySubject" },
        {
            $lookup: {
                from: "faculties",
                localField: "facultySubject.faculty",
                foreignField: "_id",
                as: "faculty",
            }
        },
        { $unwind: "$faculty" },
        {
            $lookup: {
                from: "users",
                localField: "faculty.user_id",
                foreignField: "_id",
                as: "facultyUser",
            }
        },
        { $unwind: "$facultyUser" },
        {
            $group: {
                _id: {
                    subject: "$facultySubject.subject",
                    formType: "$facultySubject.formType"
                },
                totalClassess: { $sum: 1 },
                totalPresent: {
                    $sum: {
                        $cond: {
                            if: "$students.isPresent",
                            then: 1,
                            else: 0
                        }
                    }
                },
                faculty: { $first: "$facultyUser.fullname" },
                subject: { $first: "$facultySubject.subject" },
                formType: { $first: "$facultySubject.formType" },
            }
        },
        {
            $addFields: {
                totalPercentage: {
                    $multiply: [
                        { $divide: ["$totalPresent", "$totalClassess"] },
                        100
                    ]
                }
            }
        },
        {
            $project: {
                subject: 1,
                formType: 1,
                faculty: 1,
                totalPresent: 1,
                totalClassess: 1,
                totalPercentage: 1,
            }
        }
    ]);

    if (!attendance) {
        throw new ApiError(500, "Failed to fetch attendance record");
    }

    return res.status(200).json(
        new ApiResponse(200, attendance, "successsfully attendance record")
    );
});

export const getStudentAttendanceBySubject = asyncHandler(async (req, res) => {
    const student = await Student.findOne({ user_id: req.user?._id })
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const { subject, formType } = req.params;
    if (!subject || subject.trim() == "" || !formType || !["practical", "theory"].includes(formType)) {
        throw new ApiError(401, "Subject and formType are required");
    }

    const attendance = await Attendance.aggregate([
        { $unwind: "$students" },
        {
            $match: {
                "students.student": student._id
            }
        },
        {
            $lookup: {
                from: "facultysubjects",
                localField: "facultySubject",
                foreignField: "_id",
                as: "facultySubject",
                pipeline: [
                    {
                        $project: {
                            subject: 1,
                            formType: 1,
                            faculty: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$facultySubject" },
        {
            $match: {
                "facultySubject.subject": subject,
                "facultySubject.formType": formType,
            }
        },
        {
            $lookup: {
                from: "faculties",
                localField: "facultySubject.faculty",
                foreignField: "_id",
                as: "faculty",
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
                                        fullname: 1,
                                        email: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$user"
                    },
                    {
                        $project: {
                            dept: 1,
                            isHOD: 1,
                            facultyName: "$user.fullname",
                            facultyEmail: "$user.email",
                        }
                    }
                ]
            }
        },
        { $unwind: "$faculty" },
        {
            $project: {
                facultySubject: "$facultySubject.subject",
                formType: "$facultySubject.formType",
                faculty: 1,
                attendance: {
                    isPresent: "$students.isPresent",
                    date: "$createdAt"
                }
            }
        },
        {
            $group: {
                _id: "$students.student",
                facultySubject: { $first: "$facultySubject" },
                formType: { $first: "$formType" },
                faculty: { $first: "$faculty" },
                attendance: {
                    $push: "$attendance"
                }
            }
        },
        {
            $project: {
                _id: 0,
                facultySubject: 1,
                formType: 1,
                faculty: 1,
                attendance: 1
            }
        }
    ]);


    if (!Array.isArray(attendance) || attendance.length === 0) {
        throw new ApiError(500, "Failed to fetch attendance record for given subject");
    }

    return res.status(200).json(
        new ApiResponse(200, attendance[0], "successsfully attendance record for subject")
    );
});

//faculty routes
export const getStudentAttendanceByFacultyId = asyncHandler(async (req, res) => {

    const faculty = await Faculty.findOne({ user_id: req.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }
    const attendance = await FacultySubject.aggregate([
        {
            $match: {
                faculty: faculty._id
            }
        },
        {
            $lookup: {
                from: "attendances",
                localField: "_id",
                foreignField: "facultySubject",
                as: "attendance",

            }
        },
        {
            $lookup: {
                from: "departments",
                localField: "dept",
                foreignField: "_id",
                as: "dept",
                pipeline: [
                    {
                        $project: {
                            name: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$dept"
        },
        { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: true } },
        {
            $unwind: {
                path: "$attendance.students",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: "$_id",
                facultySubject: { $first: "$_id" },
                subject: { $first: "$subject" },
                formType: { $first: "$formType" },
                year: { $first: "$year" },
                classSection: { $first: "$classSection" },
                dept: { $first: "$dept" },
                totalClassess: { $addToSet: "$attendance._id" },
                totalPresent: {
                    $sum: {
                        $cond: {
                            if: "$attendance.students.isPresent",
                            then: 1,
                            else: 0
                        }
                    }
                },
                totalStudents: {
                    $sum: {
                        $cond: {
                            if: "$attendance.students",
                            then: 1,
                            else: 0
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                totalClassess: { $size: "$totalClassess" },
            }
        },
        {
            $addFields: {
                totalPercentage: {
                    $cond: {
                        if: { $eq: ["$totalClassess", 0] },
                        then: 0,
                        else: {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ["$totalPresent", "$totalStudents"] },
                                        100
                                    ]
                                },
                                2
                            ]
                        }
                    },
                }
            }
        },
        {
            $project: {
                _id: 0,
                facultySubject: 1,
                subject: 1,
                dept: 1,
                classSection: 1,
                subject: 1,
                formType: 1,
                year: 1,
                totalClassess: 1,
                totalPercentage: 1,
            }
        },
        {
            $sort: { classSection: 1 }
        }
    ]);

    if (!Array.isArray(attendance) || attendance.length === 0) {
        throw new ApiError(500, "Failed to fetch attendance record for given subject");
    }

    return res.status(200).json(
        new ApiResponse(200, attendance, "successsfully attendance record for faculty")
    );
});

export const getStudentAttendanceByClassSection = asyncHandler(async (req, res) => {
    const { faculty_subject } = req.params;
    if (!faculty_subject) {
        throw new ApiError(401, "Faculty Subject is required");
    }

    const attendance = await Attendance.find({ facultySubject: faculty_subject });

    if (attendance.length === 0) {
        const facultySubject = await FacultySubject.findById(faculty_subject).populate("subject");

        if (!facultySubject) {
            throw new ApiError(404, "Faculty not found for this subject");
        }

        const academic_year = getStudentAcademicYear(facultySubject.subject.year);
        const student = await Student.find({
            dept: facultySubject.subject.dept,
            classSection: facultySubject.classSection,
            academic_year: academic_year
        }).populate("users", "fullname email").select("roll_no");

        return res.status(200).json(
            new ApiResponse(200, student, "successfully fetched students for this subjec")
        );
    }

    const attendance_record = await Attendance.aggregate([
        {
            $match: {
                facultySubject: new mongoose.Types.ObjectId(faculty_subject)
            }
        },
        { $unwind: "$students" },
        {
            $lookup: {
                from: "students",
                localField: "students.student",
                foreignField: "_id",
                as: "studentUser",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user",
                        }
                    },
                    {
                        $unwind: "$user"
                    }
                ]
            }
        },
        {
            $unwind: "$studentUser",
        },
        {
            $project: {
                students: 1,
                createdAt: 1,
                roll_no: "$studentUser.roll_no",
                fullname: "$studentUser.user.fullname",
                email: "$studentUser.user.email",
            }
        },
        {
            $group: {
                _id: "$students.student",
                fullname: { $first: "$fullname" },
                email: { $first: "$email" },
                roll_no: { $first: "$roll_no" },
                attendance: {
                    $push: {
                        date: "$createdAt",
                        isPresent: "$students.isPresent"
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                roll_no: 1,
                attendance: 1,
                email: 1,
                fullname: 1,
            }
        },
        {
            $sort: { roll_no: 1 }
        }
    ]);

    if (!Array.isArray(attendance_record) || attendance_record.length === 0) {
        throw new ApiError(500, "Failed to fetch student attendance");
    }

    return res.status(200).json(
        new ApiResponse(200, attendance_record, "successfully fetched attendance for class")
    )
});