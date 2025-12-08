import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { FacultySubject } from "../models/faculty_subject.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Student } from "../models/student.model.js";
import { getStudentAcademicYear } from "../utils/getStudentAcademicYear.js";

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
    const { attendance, faculty_id, subject, classSection, year, dept } = req.body;

    const faculty = await Faculty.findOne({ user_id: req.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    if ([faculty_id, subject, classSection, year, dept].some(
        (field) => !field ||
            ((typeof field === String) && field.trim() === "")
    )) {
        throw new ApiError(401, "facultyId, subject, classSection, year, dept are required");
    }

    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
        throw new ApiError(401, "Attendace are required");
    }

    const facultySubject = await FacultySubject.findOne({
        faculty: faculty_id,
        classSection,
        year,
        subject,
        dept
    });

    if (!facultySubject) {
        throw new ApiError(404, "faculty with this details not found");
    }

    const attendance_record = await Attendance.create({
        facultySubject,
        students: attendance
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
                        $cond: ["$students.isPresent", 1, 0]
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
    return res.status(200).json(
        new ApiResponse(200, {}, "")
    )
});

//faculty routes
export const getStudentAttendanceByFacultyId = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, {}, "")
    )
});

export const getStudentAttendanceByClassSection = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, {}, "")
    )
});

