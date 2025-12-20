import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { excelToJson } from "../utils/excelToJson.js";
import { User } from "../models/user.model.js"
import { Student } from "../models/student.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Department } from "../models/department.model.js"
import { FacultySubject } from "../models/faculty_subject.model.js";
import { Form } from "../models/form.model.js";
import { Response } from "../models/response.model.js";
import { Subject } from "../models/subject.model.js";
import { OAuth } from "../models/oauth.model.js";
import { Attendance } from "../models/attendance.model.js"

export const createDept = asyncHandler(async (req, res) => {
    const { dept_name, password, dept_code } = req.body;
    if (!dept_name || !dept_name.trim() || !dept_code || !dept_code.trim() || !password || !password.trim()) {
        throw new ApiError(400, "department name, code and password are required");
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    const studentExcel = req.files?.students?.[0];
    const facultyExcel = req.files?.faculties?.[0];
    const subjectExcel = req.files?.subjects?.[0];

    if (!studentExcel || !facultyExcel || !subjectExcel) {
        throw new ApiError(400, "Excel of student, faculty and subject is required");
    }

    try {
        const [department] = await Department.create([{ name: dept_name, code: dept_code }], { session });
        const deptId = department._id;

        const studentData = await excelToJson(studentExcel);
        const facultyData = await excelToJson(facultyExcel);
        const subjectData = await excelToJson(subjectExcel);

        const hashedPassword = await bcrypt.hash(password, 10);
        const studentsToInsert = [];
        const facultyToInsert = [];
        const subjectsToInsert = [];
        const usersToInsert = [];

        let emails = new Set();
        let subject_codes = new Set();
        subjectData.forEach((sub) => {
            if (!sub.subject_code || !sub.name || subject_codes.has(sub.subject_code.trim())) return;
            subject_codes.add(sub.subject_code.trim());
            subjectsToInsert.push({
                name: sub.name,
                subject_code: sub.subject_code,
                year: sub.year,
                type: sub.type,
                dept: deptId
            });
        });

        let subjectMap = new Map();
        const insertedSubjects = await Subject.insertMany(subjectsToInsert, { session });
        insertedSubjects.forEach((sub) => {
            subjectMap.set(sub.subject_code, sub._id)
        });

        const allEmails = [
            ...studentData.map(s => s.email?.toLowerCase().trim()),
            ...facultyData.map(f => f.email?.toLowerCase().trim())
        ].filter(Boolean);

        const existingUsers = await User.find(
            { email: { $in: allEmails } },
            { email: 1 },
            { session }
        );

        if (existingUsers.length) {
            throw new ApiError(
                409,
                `Emails already exist: ${existingUsers.map(u => u.email).join(", ")}`
            );
        }

        studentData.forEach((s) => {
            const email = s.email?.toLowerCase()?.trim();
            if (!email || emails.has(email)) {
                return;
            }
            emails.add(email);
            const user_id = new mongoose.Types.ObjectId();
            const electives = s.electives
                ? s.electives
                    .split(',')
                    .map(e => subjectMap.get(e.trim()))
                    .filter(v => Boolean(v))
                : [];

            studentsToInsert.push({
                user_id: user_id,
                roll_no: s.roll_no,
                academic_year: s.academic_year,
                classSection: s.classSection,
                dept: deptId,
                electives: electives
            });
            usersToInsert.push({
                _id: user_id,
                email: email,
                fullname: s.fullname,
                role: "student",
                password: hashedPassword
            });
        });
        if (usersToInsert.length === 0) {
            throw new ApiError(400, "No valid students found in Excel files");
        }

        let emailToUserId = new Map();
        facultyData.forEach((f) => {
            const email = f.email?.toLowerCase()?.trim();
            if (!email || emails.has(email)) {
                return;
            }
            emails.add(email);
            const user_id = new mongoose.Types.ObjectId();

            usersToInsert.push({
                _id: user_id,
                email: email,
                fullname: f.fullname,
                role: "faculty",
                password: hashedPassword
            });
            facultyToInsert.push({
                user_id: user_id,
                dept: deptId
            });
            emailToUserId.set(email, user_id.toString());
        });

        if (!usersToInsert.length) {
            throw new ApiError(400, "No valid faculties found in Excel files");
        }

        const insertedUsers = await User.insertMany(usersToInsert, { session });
        const insertedStudents = await Student.insertMany(studentsToInsert, { session });
        const insertedFaculties = await Faculty.insertMany(facultyToInsert, { session });

        await session.commitTransaction();
        session.endSession();
        return res.status(201).json(
            new ApiResponse(201, { department }, "Department, Students, Faculties Added Successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.code === 11000 && error.keyPattern?.email) {
            throw new ApiError(
                409,
                `Email already exists: ${error.keyValue.email}`
            );
        }
        console.error("Failed Full Creation:", error);
        throw new ApiError(500, "Failed to create department with full data");
    } finally {
        if (studentExcel?.path) await fs.unlink(studentExcel.path);
        if (facultyExcel?.path) await fs.unlink(facultyExcel.path);
        if (subjectExcel?.path) await fs.unlink(subjectExcel.path);
    }

});

export const uploadFacultySubjects = asyncHandler(async (req, res) => {
    const facultySubjectFile = req.file;
    if (!facultySubjectFile) {
        throw new ApiError(400, "Excel file is required");
    }

    const facultySubjectData = await excelToJson(facultySubjectFile);
    if (facultySubjectData.length === 0) {
        throw new ApiError(400, "File is empty");
    }

    const faculties = await Faculty.find().populate("user_id", "email");
    const subjects = await Subject.find();
    const departments = await Department.find();

    const facultyMap = new Map(
        faculties.map(f => [f.user_id.email.toLowerCase(), f])
    );
    const subjectMap = new Map(
        subjects.map(s => [s.subject_code, s])
    );
    const departmentMap = new Map(
        departments.map(d => [d.code, d])
    );

    const bulkFile = [];
    const skippedRows = [];

    for (let i = 0; i < facultySubjectData.length; i++) {
        const {
            faculty_email,
            subject_code,
            department,
            year,
            classSection,
            formType = "theory"
        } = facultySubjectData[i];

        if (!faculty_email || !subject_code || !department || !year || !classSection) {
            skippedRows.push({ row: i + 1, reason: "Missing required fields" });
            continue;
        }

        const faculty = facultyMap.get(faculty_email.toLowerCase());
        const subject = subjectMap.get(subject_code);
        const dept = departmentMap.get(department);

        if (!faculty || !subject || !dept) {
            skippedRows.push({ row: i + 1, reason: "Invalid faculty/subject/department" });
            continue;
        }

        bulkFile.push({
            faculty: faculty._id,
            subject: subject._id,
            classDepartment: dept._id,
            classYear: year,
            classSection,
            formType
        });
    }

    if (bulkFile.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    attempted: 0,
                    inserted: 0,
                    skipped: skippedRows.length,
                    skippedRows
                },
                "No valid rows to upload"
            )
        );
    }

    let insertedCount = 0;

    try {
        const result = await FacultySubject.insertMany(
            bulkFile,
            { ordered: false }
        );
        insertedCount = result.length;
    } catch (err) {
        if (err.code === 11000) {
            insertedCount = err.insertedDocs?.length || 0;
        } else {
            throw err;
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                attempted: bulkFile.length,
                inserted: insertedCount,
                skipped: skippedRows.length,
                skippedRows
            },
            `FacultySubject upload completed, inserted: ${insertedCount}`
        )
    );
});

export const editDepartment = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(400, "DepartmentId is required");
    }

    const { dept_name } = req.body;
    if (!dept_name) {
        throw new ApiError(400, "Department name is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
        department._id,
        {
            $set: {
                name: dept_name
            }
        },
        { new: true }
    )

    if (!updatedDepartment) {
        throw new ApiError(500, "Failed to update department name");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedDepartment, "successfully updated department name")
    );

});

export const getDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.aggregate([
        {
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "dept",
                as: "students",
            }
        },
        {
            $lookup: {
                from: "faculties",
                localField: "_id",
                foreignField: "dept",
                as: "faculties",
            }
        },
        {
            $lookup: {
                from: "subjects",
                localField: "_id",
                foreignField: "dept",
                as: "subjects",
            }
        },
        {
            $addFields: {
                hodDetails: {
                    $first: {
                        $filter: {
                            input: "$faculties",
                            as: "fac",
                            cond: { $eq: ["$$fac.isHod", true] }
                        }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "hodDetails.user_id",
                foreignField: "_id",
                as: "hodUser",
            }
        },
        {
            $project: {
                name: 1,
                studentCount: { $size: "$students" },
                facultyCount: { $size: "$faculties" },
                subjectCount: { $size: "$subjects" },
                hod: {
                    $ifNull: [
                        { $arrayElemAt: ["$hodUser.fullname", 0] },
                        "Not Assigned"
                    ]
                }
            }
        }

    ]);

    return res.status(200).json(
        new ApiResponse(200, departments, "successfully fetched departments")
    );
});

export const addStudentFile = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }
    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const studentFile = req.file;
    if (!studentFile) {
        throw new ApiError(403, "Excel file is required");
    }

    const studentData = await excelToJson(studentFile);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const defaultPassword = "student123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const emails = studentData.map(s => s.email);
        const existingUsers = await User.find({ email: { $in: emails } }, { email: 1 });
        const existingEmails = new Set(existingUsers.map((u) => u.email));
        const newUsers = [];
        const newStudents = [];

        studentData.forEach((s) => {
            if (!existingEmails.has(s.email)) {
                const userId = new mongoose.Types.ObjectId();
                newUsers.push({
                    _id: userId,
                    fullname: s.name,
                    email: s.email,
                    password: hashedPassword,
                    role: "student"
                });

                newStudents.push({
                    user_id: userId,
                    dept: dept_id,
                    roll_no: s.rollNo,
                    academic_year: s.year,
                    classSection: s.classSection,
                });
            }
        })

        if (newUsers.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, { duplicates: existingUsers.length }, "All students already exists")
            )
        }

        await User.insertMany(newUsers, { session });
        const student = await Student.insertMany(newStudents, { session });
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(200, { student, duplicates: existingUsers.length }, "successfully added students")
        )
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Failed to add student", error);
        throw new ApiError(500, "Failed to add students");
    }
});

export const addFacultyFile = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const facultyFile = req.file;
    if (!facultyFile) {
        throw new ApiError(403, "Excel file is required");
    }

    const facultyData = await excelToJson(facultyFile);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const password = "faculty123";
        const hashedPassword = await bcrypt.hash(password, 10);
        const emails = facultyData.map((f) => f.email);
        const existingUsers = await User.find({ email: { $in: emails } }, { email: 1 });
        const existingEmails = new Set(existingUsers.map((f) => f.email));

        const newUsers = [];
        const newFaculties = [];
        facultyData.forEach((faculty) => {
            if (!existingEmails.has(faculty.email)) {
                const userId = new mongoose.Types.ObjectId();
                const facultyId = new mongoose.Types.ObjectId();
                newUsers.push({
                    _id: userId,
                    email: faculty.email,
                    fullname: faculty.name,
                    password: hashedPassword,
                    role: "faculty",
                });
                newFaculties.push({
                    _id: facultyId,
                    user_id: userId,
                    dept: dept_id,
                    isHod: faculty.isHod,
                })

            }
        });

        if (newUsers.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, { duplicates: existingUsers.length }, "All faculties already exists")
            )
        }
        const createdUser = await User.insertMany(newUsers, { session });
        const createdFaculty = await Faculty.insertMany(newFaculties, { session });

        session.commitTransaction();
        session.endSession();
        return res.status(200).json(
            new ApiResponse(200, createdFaculty, "successfully added faculties")
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Failed to add faculty", error);
        throw new ApiError(500, "Failed to add faculty");
    }
});

export const addSubjectFile = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "Department ID is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const subjectFile = req.file;
    if (!subjectFile) {
        throw new ApiError(403, "Excel file is required");
    }

    const subjectData = await excelToJson(subjectFile);
    if (!Array.isArray(subjectData) || subjectData.length === 0) {
        throw new ApiError(403, "Excel file is empty or invalid");
    }

    const subjectCodes = subjectData
        .map(s => s.subject_code?.trim())
        .filter(Boolean);

    const existingSubjects = await Subject.find(
        { subject_code: { $in: subjectCodes } },
        { subject_code: 1 }
    );

    const existingSubjectCodes = new Set(
        existingSubjects.map(s => s.subject_code)
    );

    const subjectsToInsert = [];

    for (const sub of subjectData) {
        const code = sub.subject_code?.trim();
        const name = sub.name?.trim();

        if (!code || !name) continue;
        if (existingSubjectCodes.has(code)) continue;

        existingSubjectCodes.add(code);

        subjectsToInsert.push({
            name,
            subject_code: code,
            year: sub.year,
            type: sub.type,
            dept: dept_id
        });
    }

    if (subjectsToInsert.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No new subjects to insert")
        );
    }

    const insertedSubjects = await Subject.insertMany(subjectsToInsert);

    return res.status(200).json(
        new ApiResponse(200, insertedSubjects, "Successfully added subjects")
    );
});


export const getDepartmentById = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    const department = await Department.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(dept_id) }
        },
        {
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "dept",
                as: "students",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    {
                        $addFields: {
                            user: { $arrayElemAt: ["$user", 0] }
                        }
                    },
                    {
                        $project: {
                            roll_no: 1,
                            academic_year: 1,
                            classSection: 1,
                            "user.fullname": 1,
                            "user.email": 1
                        }
                    },
                ]
            }
        },
        {
            $sort: { roll_no: 1 }
        },
        {
            $lookup: {
                from: "faculties",
                localField: "_id",
                foreignField: "dept",
                as: "faculties",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    {
                        $addFields: {
                            user: { $arrayElemAt: ["$user", 0] }
                        }
                    },
                    {
                        $project: {
                            isHOD: 1,
                            "user.fullname": 1,
                            "user.email": 1,
                            facultysubjects: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "subjects",
                localField: "_id",
                foreignField: "dept",
                as: "subjects",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            subject_code: 1,
                            year: 1,
                            type: 1
                        }
                    }
                ]
            }
        },
    ]);


    if (department.length === 0) {
        throw new ApiError(404, "Department not found");
    }
    return res.status(200).json(
        new ApiResponse(200, department[0], "successfull fetched department")
    );
});

export const getStudentsByDept = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const departmentStudents = await Student.find({ dept: department._id });
    if (!departmentStudents) {
        throw new ApiError(404, "Department Students not found");
    }

    return res.status(200).json(
        new ApiResponse(200, departmentStudents, "successfull fetched department students")
    );
});

export const getFacultyByDept = asyncHandler(async (req, res) => {

});

export const deleteDepartment = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(400, "Department id is required");
    }

    const dept = await Department.findById(dept_id);
    if (!dept) {
        throw new ApiError(404, "Department not found");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const students = await Student.find({ dept: dept_id }).select("user_id").session(session);
        const faculties = await Faculty.find({ dept: dept_id }).select("user_id").session(session);
        const userIds = [...students.map(s => s.user_id), ...faculties.map(f => f.user_id)];

        const facultySubjects = await FacultySubject.find({ dept: dept_id }).select("_id").session(session)
        const facultySubjectIds = facultySubjects.map((fs) => fs._id);

        await Attendance.deleteMany({
            facultySubject: { $in: facultySubjectIds }
        }, { session })
        await Response.deleteMany({ dept: dept_id }, { session })
        await Form.deleteMany({ dept: dept_id }, { session })
        await FacultySubject.deleteMany({ dept: dept_id }, { session })
        await Subject.deleteMany({ dept: dept_id }, { session })
        await Faculty.deleteMany({ dept: dept_id }, { session })
        await Student.deleteMany({ dept: dept_id }, { session })

        if (userIds.length > 0) {
            await OAuth.deleteMany({ user_id: { $in: userIds } }, { session })
            await User.deleteMany(
                { _id: { $in: userIds } },
                { session }
            );
        }

        await Department.findByIdAndDelete(dept_id, { session })

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(200, {}, "Successfully deleted department and all related data")
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("deleteDepartment :: error :: ", error)
        throw new ApiError(500, "Something went wrong while deleting");
    }
});
