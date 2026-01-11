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
import { ClassSection } from "../models/class_section.model.js";
import { getStudentYear } from "../utils/student.utils.js";

//department controllers
export const createDepartment = asyncHandler(async (req, res) => {
    const { dept_name, dept_code } = req.body;
    if (!dept_name || !dept_name.trim() || !dept_code || !dept_code.trim()) {
        throw new ApiError(400, "department name, code  are required");
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    const facultyExcel = req.files?.faculties?.[0];
    const subjectExcel = req.files?.subjects?.[0];
    const classFile = req.files?.classess[0];

    if (!facultyExcel || !subjectExcel || !classFile) {
        throw new ApiError(400, "Excel of faculty, class and subject is required");
    }

    const password = dept_code.toLowerCase() + "123";
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [department] = await Department.create([{ name: dept_name, code: dept_code }], { session });
        const deptId = department._id;

        const facultyData = await excelToJson(facultyExcel);
        const subjectData = await excelToJson(subjectExcel);
        const classData = await excelToJson(classFile);

        const facultyToInsert = [];
        const subjectsToInsert = [];
        const usersToInsert = [];
        const classMapExcel = new Map();

        for (const c of classData) {
            const key = `${c.year}_${c.name}`;
            if (!classMapExcel.get(key)) {
                classMapExcel.set(key, {
                    dept: department._id,
                    year: c.year,
                    name: c.name,
                    strength: Number(c.strength),
                    batches: []
                });
            }

            classMapExcel.get(key).batches.push({
                code: c.code,
                type: c.type,
                rollRange: {
                    from: Number(c.roll_from),
                    to: Number(c.roll_to)
                }
            });
        }
        const classesToInsert = Array.from(classMapExcel.values());
        const insertedClasses = await ClassSection.insertMany(classesToInsert, { session });

        let subject_codes = new Set();
        subjectData.forEach((sub) => {
            if (!sub.subject_code || !sub.name || subject_codes.has(sub.subject_code.trim())) return;
            subject_codes.add(sub.subject_code.trim());
            subjectsToInsert.push({
                name: sub.name,
                subject_code: sub.subject_code,
                year: sub.year,
                type: sub.type,
                semester: sub.semester,
                dept: deptId
            });
        });

        let subjectMap = new Map();
        const insertedSubjects = await Subject.insertMany(subjectsToInsert, { session });
        insertedSubjects.forEach((sub) => {
            subjectMap.set(sub.subject_code, sub._id)
        });

        const allEmails = [
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

        let emails = new Set();
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
                dept: deptId,
                designation: f.designation
            });
            emailToUserId.set(email, user_id.toString());
        });

        if (!usersToInsert.length) {
            throw new ApiError(400, "No valid faculties found in Excel files");
        }

        const insertedUsers = await User.insertMany(usersToInsert, { session });
        const insertedFaculties = await Faculty.insertMany(facultyToInsert, { session });

        await session.commitTransaction();
        session.endSession();
        return res.status(201).json(
            new ApiResponse(201, { department }, "Department, Faculties and Subjects Added Successfully")
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
        if (facultyExcel?.path) await fs.unlink(facultyExcel.path);
        if (subjectExcel?.path) await fs.unlink(subjectExcel.path);
        if (classFile?.path) await fs.unlink(classFile.path);
    }

});

export const uploadFacultySubjects = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(400, "DepartmentId is required");
    }

    const facultySubjectFile = req.file;
    if (!facultySubjectFile) {
        throw new ApiError(400, "Excel file is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const facultySubjectData = await excelToJson(facultySubjectFile);
    if (facultySubjectData.length === 0) {
        throw new ApiError(400, "File is empty");
    }

    const faculties = await Faculty.find().populate("user_id", "email");
    const classess = await ClassSection.find({ dept: department._id });

    const subjects = await Subject.find({});

    const facultyMap = new Map(
        faculties.map(f => [f.user_id.email.toLowerCase(), f])
    );

    const subjectMap = new Map(
        subjects.map(s => [s.subject_code, s])
    );

    const classMap = new Map(
        classess.map(c => [`${c.year}_${c.name[0]}`, c])
    );

    const bulkFile = [];
    const skippedRows = [];

    for (let i = 0; i < facultySubjectData.length; i++) {
        const {
            faculty_email,
            subject_code,
            year,
            class_name,
            formType = "theory",
            batch_code
        } = facultySubjectData[i];

        if (!faculty_email || !subject_code || !year || !class_name) {
            skippedRows.push({ row: i + 1, reason: "Missing required fields" });
            continue;
        }

        const faculty = facultyMap.get(faculty_email.toLowerCase());
        const subject = subjectMap.get(subject_code);
        const classKey = `${year}_${class_name}`;
        const classDoc = classMap.get(classKey);

        if (!faculty || !subject || !classDoc) {
            skippedRows.push({
                row: i + 1,
                reason: "Invalid faculty / subject / class"
            });
            continue;
        }

        if (formType !== "theory") {
            if (!batch_code) {
                skippedRows.push({
                    row: i + 1,
                    reason: "Batch code required for practical/tutorial"
                });
                continue;
            }

            const batchExists = classDoc.batches.some(
                b => b.code === batch_code && b.type === formType
            );

            if (!batchExists) {
                skippedRows.push({
                    row: i + 1,
                    reason: `Invalid batch ${batch_code} for ${formType}`
                });
                continue;
            }
        }

        bulkFile.push({
            faculty: faculty._id,
            subject: subject._id,
            class_id: classDoc._id,
            batch_code: formType === "theory" ? null : batch_code,
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
            return res.status(500).json(
                new ApiResponse(500, {}, "Bulk insert failed", [])
            );
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
                            type: 1,
                            semester: 1
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

//student controllers
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
    if (!studentData.length) {
        throw new ApiError(400, "Excel file is empty");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const defaultPassword = "student123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const emails = studentData.map(s => s.email.toLowerCase());
        const existingUsers = await User.find(
            { email: { $in: emails } },
            { email: 1 }
        );

        const existingEmailSet = new Set(
            existingUsers.map(u => u.email)
        );

        const classNames = [...new Set(studentData.map(s => s.class_name))];

        const classSections = await ClassSection.find({
            dept: dept_id,
            name: { $in: classNames }
        });

        if (!classSections.length) {
            throw new ApiError(404, "No matching classes found for department");
        }

        const classMap = new Map();
        classSections.forEach(cs => {
            classMap.set(`${cs.year}_${cs.name}`, cs._id);
        });

        const newUsers = [];
        const newStudents = [];
        let skipped = 0;

        for (const s of studentData) {
            const email = s.email?.toLowerCase();
            if (!email || existingEmailSet.has(email)) {
                skipped++;
                continue;
            }

            const year = getStudentYear(s.academic_year);
            const key = `${year}_${s.class_name}`;
            const class_id = classMap.get(key);

            if (!class_id) {
                skipped++;
                continue;
            }

            const userId = new mongoose.Types.ObjectId();

            newUsers.push({
                _id: userId,
                fullname: s.fullname,
                email,
                password: hashedPassword,
                role: "student"
            });

            newStudents.push({
                user_id: userId,
                dept: dept_id,
                roll_no: Number(s.roll_no),
                academic_year: Number(s.academic_year),
                class_id
            });
        }

        if (!newUsers.length) {
            await session.abortTransaction();
            session.endSession();

            return res.status(200).json(
                new ApiResponse(
                    200,
                    { inserted: 0, skipped },
                    "No new students to insert"
                )
            );
        }

        await User.insertMany(newUsers, { session });
        await Student.insertMany(newStudents, { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    inserted: newStudents.length,
                    skipped
                },
                "Students added successfully"
            )
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Failed to add students", error);
        throw new ApiError(500, "Failed to add students");
    }
});

export const addStudent = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId and StudentId are required");
    }
    const {
        email,
        fullname,
        academic_year,
        class_name,
        roll_no,
        electives = []
    } = req.body;

    if (!email || !fullname || !academic_year || !class_name || !roll_no || !Array.isArray(electives)) {
        throw new ApiError(400, "All fields are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "Student already exists");
    }

    const password = department.code.toLowerCase() + "1234";

    const hashedPassword = await bcrypt.hash(password, 10);

    const studentUser = await User.create({
        email,
        fullname,
        password: hashedPassword
    });

    const classSection = await ClassSection.findOne({
        name: class_name,
        year: getStudentYear(academic_year),
        dept: department._id
    });

    if (!classSection) {
        throw new ApiError(404, "ClassSection not found");
    }

    const student = await Student.create({
        user_id: studentUser._id,
        dept: department._id,
        roll_no,
        class_id: classSection?._id,
        electives,
        academic_year,
    });

    if (!student) {
        throw new ApiError(500, "Failed to add student data");
    }

    return res.status(200).json(
        200, {}, "successfully added student data"
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

    const departmentStudents = await Student.find({ dept: department._id }).populate("user_id", "fullname email").populate("class_id", "name");
    if (!Array.isArray(departmentStudents) || departmentStudents.length === 0) {
        throw new ApiError(404, "Department Faculties not found");
    }

    return res.status(200).json(
        new ApiResponse(200, departmentStudents, "successfull fetched department students")
    );
});

export const updateStudent = asyncHandler(async (req, res) => {

    const { dept_id, student_id } = req.params;
    if (!dept_id || !student_id) {
        throw new ApiError(403, "DepartmentId and StudentId are required");
    }

    const {
        email,
        fullname,
        academic_year,
        class_name,
        roll_no,
        electives = []
    } = req.body;

    if (!email || !fullname || !academic_year || !class_name || !roll_no || !Array.isArray(electives)) {
        throw new ApiError(400, "All fields are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }


    const classSection = await ClassSection.findOne({
        name: class_name,
        year: getStudentYear(academic_year),
        dept: department._id
    });

    if (!classSection) {
        throw new ApiError(404, "ClassSection not found");
    }

    const updatedStudent = await Student.findByIdAndUpdate(
        student_id,
        {
            $set: {
                roll_no,
                class_id: classSection?._id,
                electives,
                academic_year,
            }
        },
        { new: true }
    );

    if (!updatedStudent) {
        throw new ApiError(500, "Failed to update student data");
    }

    await User.findByIdAndUpdate(
        updatedStudent?.user_id,
        {
            $set: {
                email,
                fullname,
            }
        }
    );

    return res.status(200).json(
        200, {}, "successfully updated student data"
    );
});

//faculty controllers
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

export const addFaculty = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId and StudentId are required");
    }
    const {
        email,
        fullname,
        designation
    } = req.body;

    if (!email || !fullname || !designation) {
        throw new ApiError(400, "All fields are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "Faculty already exists");
    }

    const password = department.code.toLowerCase() + "1234";

    const hashedPassword = await bcrypt.hash(password, 10);

    const facultyUser = await User.create({
        email,
        fullname,
        password: hashedPassword
    });

    const faculty = await Faculty.create({
        user_id: facultyUser._id,
        dept: department._id,
        designation
    });

    if (!faculty) {
        throw new ApiError(500, "Failed to add faculty data");
    }

    return res.status(200).json(
        200, {}, "successfully added faculty data"
    );
});

export const getFacultiesByDept = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const departmentFaculties = await Faculty.find({ dept: department._id }).populate("user_id", "fullname email");
    if (!Array.isArray(departmentFaculties) || departmentFaculties.length === 0) {
        throw new ApiError(404, "Department Faculties not found");
    }

    return res.status(200).json(
        new ApiResponse(200, departmentFaculties, "successfull fetched department faculties")
    );

});

export const updateFaculty = asyncHandler(async (req, res) => {

    const { dept_id, faculty_id } = req.params;
    if (!dept_id || !faculty_id) {
        throw new ApiError(403, "DepartmentId and FacultyId are required");
    }

    const {
        email,
        fullname,
        designation
    } = req.body;

    if (!email || !fullname || !designation) {
        throw new ApiError(400, "All fields are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const updatedFaculty = await Faculty.findByIdAndUpdate(
        faculty_id,
        {
            $set: {
                designation
            }
        }
    );

    if (!updatedFaculty) {
        throw new ApiError(500, "Failed to update faculty data");
    }

    await User.findByIdAndUpdate(
        updatedFaculty?.user_id,
        {
            $set: {
                email,
                fullname,
            }
        }
    );

    return res.status(200).json(
        200, {}, "successfully updated faculty data"
    );
});

//subject controllers
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

export const addSubject = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId and SubjectId are required");
    }

    const {
        name,
        subject_code,
        year,
        type,
        semester,
    } = req.body;

    if (!subject_code || !name || !year || !type || !semester) {
        throw new ApiError(400, "All fields are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const subject = await Subject.create({
        dept: department._id,
        name,
        subject_code,
        year,
        type,
        semester,
    });

    if (!subject) {
        throw new ApiError(500, "Failed to add subject data");
    }

    return res.status(200).json(
        200, {}, "successfully added subject data"
    );
});

export const getSubjectsByDept = asyncHandler(async (req, res) => {

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const departmentSubjects = await Subject.find({ dept: department._id });
    if (!Array.isArray(departmentSubjects) || departmentSubjects.length === 0) {
        throw new ApiError(404, "Department Subjects not found");
    }

    return res.status(200).json(
        new ApiResponse(200, departmentSubjects, "successfull fetched department subjects")
    );

});

export const updateSubject = asyncHandler(async (req, res) => {

    const { dept_id, subject_id } = req.params;
    if (!dept_id || !subject_id) {
        throw new ApiError(403, "DepartmentId and SubjectId are required");
    }

    const {
        name,
        subject_code,
        year,
        type,
        semester,
    } = req.body;


    if (!subject_code || !name || !year || !type || !semester) {
        throw new ApiError(400, "All fields are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
        subject_id,
        {
            $set: {
                name,
                subject_code,
                year,
                type,
                semester,
            }
        }
    );

    if (!updatedSubject) {
        throw new ApiError(500, "Failed to update subject data");
    }

    return res.status(200).json(
        200, {}, "successfully updated subject data"
    );
});

//class controllers
export const addClassFile = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "Department ID is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const classFile = req.file;
    if (!classFile) {
        throw new ApiError(403, "Excel file is required");
    }

    const classData = await excelToJson(classFile);
    if (!Array.isArray(classData) || classData.length === 0) {
        throw new ApiError(403, "Excel file is empty or invalid");
    }

    const classMapExcel = new Map();

    for (const c of classData) {
        if (!c.year || !c.name || !c.code) continue;

        const key = `${c.year}_${c.name}`;

        if (!classMapExcel.has(key)) {
            classMapExcel.set(key, {
                dept: dept_id,
                year: c.year,
                name: c.name,
                strength: Number(c.strength),
                batches: []
            });
        }

        classMapExcel.get(key).batches.push({
            code: c.code,
            type: c.type,
            rollRange: {
                from: Number(c.roll_from),
                to: Number(c.roll_to)
            }
        });
    }

    if (!classMapExcel.size) {
        return res.status(200).json(
            new ApiResponse(200, [], "No new classes to insert")
        );
    }

    const classesToInsert = Array.from(classMapExcel.values());
    const insertedClasses = await ClassSection.insertMany(classesToInsert);

    return res.status(200).json(
        new ApiResponse(200, insertedClasses, "Successfully added classes")
    );
});

export const addClass = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }

    const { year, name, strength, batches } = req.body;

    if (!year || !name || !strength) {
        throw new ApiError(400, "Year, name and strength are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const classSection = await ClassSection.create({
        dept: department._id,
        year,
        name,
        strength,
        batches: batches || []
    });

    if (!classSection) {
        throw new ApiError(500, "Failed to add class data");
    }

    return res.status(200).json(
        new ApiResponse(200, classSection, "Successfully added class")
    );
});

export const getClassesByDept = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(403, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const classes = await ClassSection.find({ dept: department._id });

    if (!Array.isArray(classes) || classes.length === 0) {
        throw new ApiError(404, "Department classes not found");
    }

    return res.status(200).json(
        new ApiResponse(200, classes, "Successfully fetched department classes")
    );
});

export const updateClass = asyncHandler(async (req, res) => {
    const { dept_id, class_id } = req.params;
    if (!dept_id || !class_id) {
        throw new ApiError(403, "DepartmentId and ClassId are required");
    }

    const { year, name, strength } = req.body;

    if (!year || !name || !strength) {
        throw new ApiError(400, "Year, name and strength are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const updatedClass = await ClassSection.findByIdAndUpdate(
        class_id,
        {
            $set: {
                year,
                name,
                strength
            }
        },
        { new: true }
    );

    if (!updatedClass) {
        throw new ApiError(500, "Failed to update class data");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedClass, "Successfully updated class data")
    );
});
