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

export const createDepartment = asyncHandler(async (req, res) => {
    // Input: dept_name
    // 1. Validate dept_name
    // 2. Check if department already exists
    // 3. Create new department document
    // 4. Return department info

    const { dept_name } = req.body;
    if (!dept_name) {
        throw new ApiError(401, "Department name is required");
    }

    const existedDepartment = await Department.findOne({ name: dept_name });

    if (existedDepartment) {
        throw new ApiError(409, "Department already exists");
    }

    const department = await Department.create({
        name: dept_name
    });

    return res.status(200).json(
        new ApiResponse(200, department, "Department created successfully")
    );
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
    // 1. Validate dept exists
    // 3. Return all dept

    const departments = await Department.find();
    if (!departments) {
        throw new ApiError(500, "Failed to fetch departments");
    }

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
                from: "faculties",
                localField: "_id",
                foreignField: "dept",
                as: "faculties",
                pipeline: [
                    {
                        $lookup: {
                            from: "facultysubjects",
                            localField: "_id",
                            foreignField: "faculty",
                            as: "facultysubjects"
                        }
                    }
                ]
            }
        },
    ]);

    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    return res.status(200).json(
        new ApiResponse(200, department, "successfull fetched department")
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