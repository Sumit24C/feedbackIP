import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Student } from "../models/student.model.js";
import { Department } from "../models/department.model.js"
import * as XLSX from "xlsx"
import fs from "fs-extra"
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { excelToJson } from "../utils/excelToJson.js";
import { Faculty } from "../models/faculty.model.js";
import { FacultySubject } from "../models/faculty_subject.model.js";
import { Form } from "../models/form.model.js";
import { Response } from "../models/response.model.js";

export const createDepartment = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { dept_name } = req.body;
        const studentFile = req.files?.students?.[0];
        const facultyFile = req.files?.faculties?.[0];

        if (!dept_name) throw new ApiError(401, "Department name is required");
        if (!studentFile) throw new ApiError(401, "Student Excel File Required");
        if (!facultyFile) throw new ApiError(401, "Faculty Excel File Required");

        // ✅ Step 1: Create Department
        const existed = await Department.findOne({ name: dept_name });
        if (existed) throw new ApiError(409, "Department already exists");

        const department = await Department.create({ name: dept_name });

        // ✅ Step 2: Convert Excel
        const studentData = await excelToJson(studentFile);
        const facultyData = await excelToJson(facultyFile);
        console.log("faculty: ", facultyData);
        // ✅ Step 3: Add Students
        const hashedStudentPass = await bcrypt.hash("student123", 10);
        const studentEmails = studentData.map(s => s.email);
        const existingStu = await User.find({ email: { $in: studentEmails } });
        const existStuEmails = new Set(existingStu.map(e => e.email));

        const newUsers = [];
        const newStudents = [];

        console.log(studentData);
        studentData.forEach(s => {
            if (!existStuEmails.has(s.email)) {
                const uid = new mongoose.Types.ObjectId();
                newUsers.push({
                    _id: uid,
                    fullname: s.name,
                    email: s.email,
                    password: hashedStudentPass,
                    role: "student"
                });

                newStudents.push({
                    user_id: uid,
                    dept: department._id,
                    roll_no: s.roll_no,
                    academic_year: s.year,
                    classSection: s.classSection
                });
            }
        });
        console.log("users: ",newUsers);

        // ✅ Step 4: Add Faculties
        const hashedFacultyPass = await bcrypt.hash("faculty123", 10);
        const facultyEmails = facultyData.map(s => s.email);

        // users already in DB
        const existingFac = await User.find({ email: { $in: facultyEmails } });

        const existFacEmails = new Map();   // email → faculty._id
        existingFac.forEach(u => {
            existFacEmails.set(u.email, u._id);
        });

        const newFacUsers = [];
        const newFaculties = [];
        const subjects = [];

        const uploadEmailToFacultyId = new Map(); // ✅ Track emails within this upload

        facultyData.forEach(f => {
            const email = f.email;

            let facultyUserId;

            // ✅ CASE 1: Already exists in DB
            if (existFacEmails.has(email)) {
                facultyUserId = existFacEmails.get(email);
            }
            // ✅ CASE 2: First time in this upload — create new User + Faculty
            else if (!uploadEmailToFacultyId.has(email)) {
                const uid = new mongoose.Types.ObjectId();
                const fid = new mongoose.Types.ObjectId();

                newFacUsers.push({
                    _id: uid,
                    fullname: f.name,
                    email,
                    password: hashedFacultyPass,
                    role: "faculty",
                });

                newFaculties.push({
                    _id: fid,
                    user_id: uid,
                    dept: department._id,
                    isHod: f.isHod,
                });

                // ✅ store so next time we find same email, we reuse fid
                uploadEmailToFacultyId.set(email, fid);
                facultyUserId = uid;
            }
            // ✅ CASE 3: Duplicate in upload — user already created in this batch
            else {
                facultyUserId = uploadEmailToFacultyId.get(email);
            }

            // subject must always be added
            subjects.push({
                faculty: facultyUserId,
                dept: department._id,
                classSection: f.classSection,
                subject: f.subjectName,
                formType: f.formType,
                year: f.year,
            });
        });

        // ✅ DB insert
        await User.insertMany(newFacUsers, { session });
        await User.insertMany(newUsers, { session });
        await Student.insertMany(newStudents, { session });
        const insertedFaculties = await Faculty.insertMany(newFaculties, { session });

        // ✅ After insert, update map: DB user → faculty id
        insertedFaculties.forEach(f => {
            existFacEmails.set(f.email, f._id);
        });
        console.log("subjects: ",subjects);
        await FacultySubject.insertMany(subjects, { session });

        const hod = insertedFaculties.find((f) => f.isHOD === true);
        const updatedDepartment = await Department.findByIdAndUpdate(
            department._id,
            { $set: { hod: hod?._id || null } },
            { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(200, { updatedDepartment }, "✅ Department, Students, Faculties Added Successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log("Failed Full Creation:", error);
        throw new ApiError(500, "Failed to create department with full data");
    }
});

export const editDepartment = asyncHandler(async (req, res) => {
    // Input: dept_id, fields to update
    // 1. Validate dept exists
    // 2. Update department fields
    // 3. Return updated dept

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }


    const { dept_name } = req.body;
    if (!dept_name) {
        throw new ApiError(403, "Department name is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }
    console.log(typeof (department._id))

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

export const addStudents = asyncHandler(async (req, res) => {
    // Input: dept_id, students: [{name, email, rollNo, classSection, year}]
    // 1. Validate dept_id exists
    // 2. Loop through each student:
    //    a. Create User document with role 'student' and default password
    //    b. Hash password
    //    c. Create Student document linking userId and deptId
    // 3. Return created students

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
        console.log("Failed to add student", error);
        throw new ApiError(500, "Failed to add students");
    }
});

export const addFaculty = asyncHandler(async (req, res) => {
    // Input: dept_id, faculty: [{name, email, isHod, classesSubjects: [{classSection, subjectName, formType}]}]
    // 1. Validate dept_id exists
    // 2. Loop through each faculty:
    //    a. Create User document with role 'faculty' and default password
    //    b. Create Faculty document linking userId and deptId
    //    c. For each class/subject, create a subject_mapping document
    // 3. Return created faculty

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
    console.log(facultyData);
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
        const subject_mapping = [];
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
                console.log("isHod: ", faculty.isHod);
                newFaculties.push({
                    _id: facultyId,
                    user_id: userId,
                    dept: dept_id,
                    isHod: faculty.isHod,
                })

                subject_mapping.push({
                    faculty: facultyId,
                    dept: dept_id,
                    classSection: faculty.classSection,
                    subject: faculty.subjectName,
                    formType: faculty.formType,
                    year: faculty.year
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
        const createdMapping = await FacultySubject.insertMany(subject_mapping, { session });

        session.commitTransaction();
        session.endSession();
        return res.status(200).json(
            new ApiResponse(200, createdFaculty, "successfully added faculties")
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log("Failed to add faculty", error);
        throw new ApiError(500, "Failed to add faculty");
    }
});

export const getDepartmentById = asyncHandler(async (req, res) => {
    // 1. Validate dept exists
    // 3. Return dept

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
                        $lookup: {
                            from: "facultysubjects",
                            localField: "_id",
                            foreignField: "faculty",
                            as: "facultysubjects"
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
        }
    ]);


    if (department.length === 0) {
        throw new ApiError(404, "Department not found");
    }
    return res.status(200).json(
        new ApiResponse(200, department[0], "successfull fetched department")
    );
});

export const getStudentsByDept = asyncHandler(async (req, res) => {
    // 1. Validate dept exists
    // 3. Return students
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
    // 1. Validate dept exists
    // 3. Return faculties


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
        await Department.findByIdAndDelete(dept_id, { session })
        await Form.deleteMany({ dept: dept_id }, { session })
        await FacultySubject.deleteMany({ dept: dept_id }, { session })
        await Faculty.deleteMany({ dept: dept_id }, { session })
        await Student.deleteMany({ dept: dept_id }, { session })
        await Response.deleteMany({ dept: dept_id }, { session })

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
