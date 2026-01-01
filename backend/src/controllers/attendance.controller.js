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
            { $le: 36 } : { $ge: 37 }
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


    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
        throw new ApiError(401, "Attendace are required");
    }

    const facultySubject = await FacultySubject.findById(faculty_subject);

    if (!facultySubject) {
        throw new ApiError(404, "faculty with this details not found");
    }

    const existingAttendance = await Attendance.findOne({ facultySubject: facultySubject._id, createdAt: createdAt });
    if (existingAttendance) {
        throw new ApiError(409, "Attendance record already exists");
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

export const updateAttendance = asyncHandler(async (req, res) => {
    const { attendance, createdAt = "" } = req.body;

    const faculty = await Faculty.findOne({ user_id: req.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const { attendance_id } = req.params;

    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
        throw new ApiError(401, "Attendace are required");
    }

    const attendanceDoc = await Attendance.findById(attendance_id).populate("facultySubject");

    if (!attendanceDoc) {
        throw new ApiError(404, "Attendance session not found");
    }
    if (attendanceDoc.facultySubject.faculty.toString() !== faculty._id.toString()) {
        throw new ApiError(403, "Not authorized to update this session");
    }

    attendanceDoc.students = attendance;
    if (createdAt && !isNaN(new Date(createdAt))) {
        attendanceDoc.createdAt = new Date(createdAt)
    }
    await attendanceDoc.save();

    return res.status(200).json(
        new ApiResponse(200, attendanceDoc, "successfully updated attendance_record")
    );
});

export const deleteAttendance = asyncHandler(async (req, res) => {
    const { attendance_id } = req.params;
    const faculty = await Faculty.findOne({ user_id: req.user?._id });
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    const attendanceDoc = await Attendance.findById(attendance_id).populate(
        "facultySubject"
    );

    if (!attendanceDoc) {
        throw new ApiError(404, "Attendance session not found");
    }

    if (attendanceDoc.facultySubject.faculty.toString() !== faculty._id.toString()) {
        throw new ApiError(403, "Not authorized to update this session");
    }

    await attendanceDoc.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Attendance session deleted successfully")
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
                pipeline: [
                    {
                        $lookup: {
                            from: "subjects",
                            localField: "subject",
                            foreignField: "_id",
                            as: "subject",
                            pipeline: [{
                                $project: {
                                    name: 1,
                                    _id: 1
                                }
                            }]
                        }
                    },
                ]
            }
        },
        { $unwind: "$facultySubject" },
        { $unwind: "$facultySubject.subject" },
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
                _id: "$facultySubject._id",
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
                subject: { $first: "$facultySubject.subject.name" },
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
        },
        {
            $sort: { totalPercentage: -1 }
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
    const student = await Student.findOne({ user_id: req.user?._id });
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const { faculty_subject } = req.params;
    if (!faculty_subject) {
        throw new ApiError(400, "FacultySubject id is required");
    }

    const { cursorDate, limit = 10 } = req.query;
    const limitNumber = parseInt(limit);

    const matchQuery = {
        "students.student": student._id,
        facultySubject: new mongoose.Types.ObjectId(faculty_subject),
    };

    if (cursorDate && !isNaN(new Date(cursorDate))) {
        matchQuery.createdAt = { $lt: new Date(cursorDate) };
    }

    const data = await Attendance.aggregate([
        { $unwind: "$students" },
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        { $limit: limitNumber + 1 },

        {
            $project: {
                _id: 0,
                isPresent: "$students.isPresent",
                date: "$createdAt",
            },
        },
    ]);

    const hasNextPage = data.length > limitNumber;
    const attendance = hasNextPage ? data.slice(0, limitNumber) : data;
    const nextCursor = hasNextPage
        ? attendance[attendance.length - 1].date
        : null;

    return res.json(
        new ApiResponse(
            200,
            {
                attendance,
                nextCursor,
            },
            "Successfully fetched attendance"
        )
    );
});

export const getClassByFacultySubject = asyncHandler(async (req, res) => {
    const { faculty_subject } = req.params;
    if (!faculty_subject) {
        throw new ApiError(400, "FacultySubject id is required");
    }

    const data = await FacultySubject.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(faculty_subject),
            },
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
                            _id: 1,
                            name: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$subject" },
        {
            $lookup: {
                from: "faculties",
                localField: "faculty",
                foreignField: "_id",
                as: "faculty",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            _id: 1,
                            dept: 1,
                            isHOD: 1,
                            facultyName: "$user.fullname",
                            facultyEmail: "$user.email",
                        },
                    },
                ],
            },
        },
        { $unwind: "$faculty" },
        {
            $project: {
                _id: 0,
                facultySubject: "$_id",
                subject: "$subject.name",
                formType: 1,
                faculty: 1,
            },
        },
    ]);

    if (!data.length) {
        throw new ApiError(404, "Class not found");
    }

    return res.json(
        new ApiResponse(
            200,
            data[0],
            "Successfully fetched class details"
        )
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
                from: "subjects",
                localField: "subject",
                foreignField: "_id",
                as: "subject"
            }
        },
        { $unwind: "$subject" },
        {
            $lookup: {
                from: "departments",
                localField: "classDepartment",
                foreignField: "_id",
                as: "department",
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
            $unwind: "$department"
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
                subject: { $first: "$subject.name" },
                formType: { $first: "$formType" },
                classYear: { $first: "$classYear" },
                classSection: { $first: "$classSection" },
                department: { $first: "$department.name" },
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
                department: 1,
                classSection: 1,
                formType: 1,
                classYear: 1,
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

export const getStudentAttendanceByClass = asyncHandler(async (req, res) => {
    const { faculty_subject } = req.params;
    if (!faculty_subject) {
        throw new ApiError(400, "Faculty Subject is required");
    }
    const pageNumber = Math.max(parseInt(req.query.page) || 1, 1);
    const limitNumber = Math.max(parseInt(req.query.limit) || 5, 1);
    const facultySubject = await FacultySubject
        .findById(faculty_subject)
        .populate(
            "subject", "name subject_code"
        ).select("classSection formType classYear classDepartment");

    if (!facultySubject) {
        throw new ApiError(404, "Faculty not found for this subject");
    }

    const attendanceCount = await Attendance.countDocuments({
        facultySubject: faculty_subject
    });

    const totalPages = Math.ceil(attendanceCount / limitNumber);

    if (attendanceCount === 0) {
        const academic_year = getStudentAcademicYear(facultySubject.classYear);
        const studentClassSection = facultySubject.classSection[0];
        const studentObj = {
            dept: facultySubject.classDepartment,
            classSection: studentClassSection,
            academic_year: academic_year,
        }

        if (facultySubject.formType === "practical") {
            const section = parseInt(facultySubject.classSection[1]);
            if (facultySubject.classYear === "FY") {
                if (section == 1) {
                    studentObj.roll_no = { $lte: 22 };
                } else if (section == 2) {
                    studentObj.roll_no = { $lte: 36 };
                } else {
                    studentObj.roll_no = { $gt: 36 };
                }
            } else {
                if (section == 1) {
                    studentObj.roll_no = { $lte: 36 };
                } else {
                    studentObj.roll_no = { $gt: 36 };
                }
            }
        }

        const student = await Student.find(studentObj)
            .populate("user_id", "fullname email")
            .select("roll_no");

        const attendance_record = student.map((s) =>
        ({
            _id: s._id,
            fullname: s.user_id.fullname,
            email: s.user_id.email,
            roll_no: s.roll_no,
            attendance: []
        }));

        const response = {
            attendance_record,
            totalPages: 0,
            currentPage: 1,
            facultySubject: facultySubject
        }

        return res.status(200).json(
            new ApiResponse(200, response, "Students fetched, no attendance yet")
        );
    }

    const attendance_record = await Attendance.aggregate([
        {
            $match: {
                facultySubject: new mongoose.Types.ObjectId(faculty_subject)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (pageNumber - 1) * limitNumber
        },
        {
            $limit: limitNumber
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
                        _id: "$_id",
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

    const response = {
        attendance_record: attendance_record,
        currentPage: pageNumber,
        totalPages: totalPages,
        facultySubject: facultySubject,
    }

    return res.status(200).json(
        new ApiResponse(200, response, "successfully fetched attendance for class")
    )
});

export const getAllStudentAttendanceCountByClass = asyncHandler(async (req, res) => {
    const { faculty_subject } = req.params;
    if (!faculty_subject) {
        throw new ApiError(400, "Faculty Subject is required");
    }

    const attendance_record = await Attendance.aggregate([
        {
            $match: {
                facultySubject: new mongoose.Types.ObjectId(faculty_subject),
            },
        },
        { $unwind: "$students" },
        {
            $group: {
                _id: "$students.student",
                totalAttendance: {
                    $sum: {
                        $cond: ["$students.isPresent", 1, 0],
                    },
                },
                totalRecord: { $sum: 1 },
            },
        },
        {
            $addFields: {
                totalAttendancePercent: {
                    $cond: [
                        { $eq: ["$totalRecord", 0] },
                        0,
                        {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ["$totalAttendance", "$totalRecord"] },
                                        100
                                    ]
                                },
                                2
                            ]
                        }
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0,
                studentId: "$_id",
                totalAttendance: 1,
                totalRecord: 1,
                totalAttendancePercent: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, attendance_record, "successfully fetched attendance of each student")
    )
});
