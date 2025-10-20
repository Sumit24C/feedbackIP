import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"

export const createDepartment = asyncHandler(async (req, res) => {
    // Input: dept_name
    // 1. Validate dept_name
    // 2. Check if department already exists
    // 3. Create new department document
    // 4. Return department info
});

export const addStudents = asyncHandler(async (req, res) => {
    // Input: dept_id, students: [{name, email, rollNo, classSection, year}]
    // 1. Validate dept_id exists
    // 2. Loop through each student:
    //    a. Create User document with role 'student' and default password
    //    b. Hash password
    //    c. Create Student document linking userId and deptId
    // 3. Return created students
});

export const addFaculty = asyncHandler(async (req, res) => {
    // Input: dept_id, faculty: [{name, email, isHod, classesSubjects: [{classSection, subjectName, formType}]}]
    // 1. Validate dept_id exists
    // 2. Loop through each faculty:
    //    a. Create User document with role 'faculty' and default password
    //    b. Create Faculty document linking userId and deptId
    //    c. For each class/subject, create a subject_mapping document
    // 3. Return created faculty
});

export const editDepartment = asyncHandler(async (req, res) => {
    // Input: dept_id, fields to update
    // 1. Validate dept exists
    // 2. Update department fields
    // 3. Return updated dept
});

export const getDepartments = asyncHandler(async (req, res) => {
    // 1. Validate dept exists
    // 3. Return all dept
});

export const getDepartmentById = asyncHandler(async (req, res) => {
    // 1. Validate dept exists
    // 3. Return dept
});

export const getFacultyByDept = asyncHandler(async (req, res) => {
    // 1. Validate dept exists
    // 3. Return faculties
});

export const getStudentsByDept = asyncHandler(async (req, res) => {
    // 1. Validate dept exists
    // 3. Return students
}); 