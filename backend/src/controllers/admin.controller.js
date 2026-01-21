import mongoose from "mongoose";
import bcrypt from "bcrypt";
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
import { getStudentAcademicYear, getStudentYear } from "../utils/student.utils.js";
import { Admin } from "../models/admin.model.js";
import { ElectiveEnrollment } from "../models/elective_enrollment.model.js";
import { WeeklyFeedback } from "../models/weekly_feedback.model.js";

//department controllers
export const createDepartment = asyncHandler(async (req, res) => {
    const admin = await Admin.findOne({ user_id: req.user._id });
    if (!admin) {
        throw new ApiError(404, "Admin not found")
    }

    const { dept_name, dept_code } = req.body;
    if (!dept_name || !dept_name.trim() || !dept_code || !dept_code.trim()) {
        throw new ApiError(400, "department name, code  are required");
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    const facultyExcel = req.files?.faculties?.[0];
    const subjectExcel = req.files?.subjects?.[0];
    const classFile = req.files?.classes[0];

    if (!facultyExcel || !subjectExcel || !classFile) {
        throw new ApiError(400, "Excel of faculty, class and subject is required");
    }

    const password = process.env.FACULTY_PASSWORD || "faculty123";
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [department] = await Department.create([{
            name: dept_name,
            code: dept_code,
            institute: admin.institute
        }], { session });
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
            ...facultyData.map(f => f?.email?.toLowerCase().trim())
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
                password: hashedPassword,
                institute: admin.institute
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
        if (error instanceof ApiError) {
            throw error
        }
        throw new ApiError(500, "Failed to create department with full data");
    } finally {
        // if (facultyExcel?.path) await fs.unlink(facultyExcel.path);
        // if (subjectExcel?.path) await fs.unlink(subjectExcel.path);
        // if (classFile?.path) await fs.unlink(classFile?.path);
    }

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

    const admin = await Admin.findOne({ user_id: req.user._id });
    if (!admin) {
        throw new ApiError(404, "Admin not found")
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    if (
        !admin.institute ||
        !dept.institute ||
        !admin.institute.equals(dept.institute)
    ) {
        throw new ApiError(401, "Not authorized");
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
    const admin = await Admin.findOne({ user_id: req.user._id });
    if (!admin) {
        throw new ApiError(404, "Admin not found")
    }

    const departments = await Department.aggregate([
        {
            $match: {
                institute: new mongoose.Types.ObjectId(admin.institute)
            }
        },
        {
            $lookup: {
                from: "faculties",
                localField: "_id",
                foreignField: "dept",
                as: "faculties"
            }
        },
        {
            $lookup: {
                from: "subjects",
                localField: "_id",
                foreignField: "dept",
                as: "subjects"
            }
        },
        {
            $lookup: {
                from: "classsections",
                localField: "_id",
                foreignField: "dept",
                as: "classes"
            }
        },
        {
            $lookup: {
                from: "students",
                let: { classIds: "$classes._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ["$class_id", "$$classIds"] }
                        }
                    }
                ],
                as: "students"
            }
        },
        {
            $addFields: {
                facultyCount: { $size: "$faculties" },
                subjectCount: { $size: "$subjects" },
                classCount: { $size: "$classes" },
                studentCount: { $size: "$students" },
            }
        },
        {
            $project: {
                name: 1,
                facultyCount: 1,
                subjectCount: 1,
                classCount: 1,
                studentCount: 1,
                hod: 1
            }
        }
    ]);

    if (!departments) {
        throw new ApiError(404, "Departments not found")
    }

    return res.status(200).json(
        new ApiResponse(200, departments, "successfully fetched departments")
    );
});

export const getDepartmentById = asyncHandler(async (req, res) => {
    const admin = await Admin.findOne({ user_id: req.user._id });
    if (!admin) {
        throw new ApiError(404, "Admin not found")
    }

    const { dept_id } = req.params;
    const department = await Department.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(dept_id),
                institute: admin.institute
            }
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

    const admin = await Admin.findOne({ user_id: req.user._id });
    if (!admin) {
        throw new ApiError(404, "Admin not found")
    }

    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(400, "Department id is required");
    }

    const dept = await Department.findById(dept_id);
    if (!dept) {
        throw new ApiError(404, "Department not found");
    }

    if (
        !admin.institute ||
        !dept.institute ||
        !admin.institute.equals(dept.institute)
    ) {
        throw new ApiError(401, "Not authorized");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const students = await Student.find({ dept: dept_id })
            .select("user_id")
            .session(session);

        const faculties = await Faculty.find({ dept: dept_id })
            .select("user_id")
            .session(session);

        const userIds = [
            ...students.map((s) => s.user_id),
            ...faculties.map((f) => f.user_id),
        ];

        const classSections = await ClassSection.find({ dept: dept_id })
            .select("_id")
            .session(session);

        const classIds = classSections.map((cls) => cls._id);

        const facultySubjects = await FacultySubject.find({
            class_id: { $in: classIds },
        })
            .select("_id")
            .session(session);

        const facultySubjectIds = facultySubjects.map((fs) => fs._id);

        if (facultySubjectIds.length > 0) {
            await Attendance.deleteMany(
                { facultySubject: { $in: facultySubjectIds } },
                { session }
            );

            await WeeklyFeedback.deleteMany(
                { facultySubject: { $in: facultySubjectIds } },
                { session }
            );

            await ElectiveEnrollment.deleteMany(
                { facultySubject: { $in: facultySubjectIds } },
                { session }
            );

            await FacultySubject.deleteMany(
                { _id: { $in: facultySubjectIds } },
                { session }
            );
        }

        await Response.deleteMany({ dept: dept_id }, { session });
        await Form.deleteMany(
            {
                $or: [
                    {
                        targetType: "DEPARTMENT",
                        dept: dept_id,
                    },
                    {
                        targetType: "CLASS",
                        facultySubject: { $in: facultySubjectIds },
                    },
                ],
            },
            { session }
        );
        await Subject.deleteMany({ dept: dept_id }, { session });
        await Faculty.deleteMany({ dept: dept_id }, { session });
        await Student.deleteMany({ dept: dept_id }, { session });
        await ClassSection.deleteMany({ dept: dept_id }, { session });
        if (userIds.length > 0) {
            await OAuth.deleteMany({ user_id: { $in: userIds } }, { session });
            await User.deleteMany({ _id: { $in: userIds } }, { session });
        }

        await Department.findByIdAndDelete(dept_id, { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(
            new ApiResponse(200, {}, "Successfully deleted department and all related data")
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error instanceof ApiError) {
            throw error
        }
        throw new ApiError(500, "Something went wrong while deleting");
    }
});

//facultySubject controllers
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

    const faculties = await Faculty.find().populate("user_id", "email fullname");
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

        if (formType !== "theory" && subject.type !== "elective") {
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
            facultyName: faculty.user_id.fullname,
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

export const getFacultySubjectsByDepartmentId = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    const { type } = req.query;

    if (!dept_id) {
        throw new ApiError(400, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    let facultySubjects = [];

    if (type === "elective") {
        facultySubjects = await FacultySubject.find({
            class_id: null
        })
            .select("formType subject faculty")
            .populate({
                path: "subject",
                match: { type: "elective" },
                select: "name subject_code type"
            })
            .populate({
                path: "faculty",
                populate: {
                    path: "user_id",
                    select: "email fullname"
                },
            });
    } else {
        const classes = await ClassSection.find({ dept: dept_id }).select("_id");
        if (!classes.length) {
            return res.status(200).json(
                new ApiResponse(200, [], "No classes found for this department")
            );
        }

        const classIds = classes.map(c => c._id);
        facultySubjects = await FacultySubject.find({
            $or: [
                {
                    class_id: { $in: classIds }
                },
                { class_id: null }
            ]
        })
            .select("formType batch_code class_id subject faculty")
            .populate({
                path: "class_id",
                select: "name year",
                populate: {
                    path: "dept",
                    select: "name code"
                }
            })
            .populate({
                path: "subject",
                select: "name subject_code type"
            })
            .populate({
                path: "faculty",
                populate: {
                    path: "user_id",
                    select: "email fullname"
                },
            });
    }

    facultySubjects = facultySubjects.filter(fs => fs.subject !== null);
    return res.status(200).json(
        new ApiResponse(
            200,
            facultySubjects,
            "FacultySubjects fetched successfully"
        )
    );
});

export const getFacultySubjectMeta = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;

    if (!dept_id) {
        throw new ApiError(400, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const faculties = await Faculty.find({ dept: dept_id })
        .populate({
            path: "user_id",
            select: "fullname email",
        })
        .select("_id user_id");

    const subjects = await Subject.find({ dept: dept_id })
        .select("_id name type year");

    const classes = await ClassSection.find({ dept: dept_id })
        .select("_id name year batches");

    const batchesByClass = {};
    classes.forEach(cls => {
        batchesByClass[cls._id] = cls.batches.map(b => ({
            code: b.code,
            type: b.type,
            rollRange: b.rollRange,
        }));
    });

    return res.status(200).json(
        new ApiResponse(200, {
            faculties: faculties.map(f => ({
                _id: f._id,
                name: f.user_id?.fullname,
                email: f.user_id?.email,
            })),
            subjects,
            classes: classes.map(c => ({
                _id: c._id,
                name: c.name,
                year: c.year,
            })),
            batchesByClass,
        }, "FacultySubject meta fetched successfully")
    );
});

export const addFacultySubjects = asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    if (!dept_id) {
        throw new ApiError(400, "DepartmentId is required");
    }

    const {
        faculty_id,
        subject_id,
        class_id,
        batch_code = "",
        formType
    } = req.body;

    if (!faculty_id || !subject_id || !formType) {
        throw new ApiError(400, "faculty, subject and formType are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const subject = await Subject.findById(subject_id);
    if (!subject) {
        throw new ApiError(404, "Subject not found");
    }

    if (formType !== "theory" && subject.type !== "elective" && !batch_code) {
        throw new ApiError(400, "batch_code is required");
    }

    const faculty = await Faculty.findById(faculty_id).populate("user_id", "fullname");
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    let classSectionId = null;

    if (subject.type === "dept") {
        if (!class_id) {
            throw new ApiError(400, "class_id is required for core subjects");
        }

        const classSection = await ClassSection.findById(class_id);
        if (!classSection) {
            throw new ApiError(404, "ClassSection not found");
        }

        classSectionId = classSection._id;
    }

    const facultySubject = await FacultySubject.create({
        facultyName: faculty.user_id.fullname,
        faculty: faculty._id,
        subject: subject._id,
        class_id: classSectionId,
        batch_code: batch_code,
        formType
    });

    if (!facultySubject) {
        throw new ApiError(500, "Failed to create facultySubject")
    }

    return res.status(201).json(
        new ApiResponse(201, facultySubject, "FacultySubject created successfully")
    );
});

export const updateFacultySubject = asyncHandler(async (req, res) => {
    const { dept_id, facultySubjectId } = req.params;

    if (!dept_id || !facultySubjectId) {
        throw new ApiError(400, "DepartmentId and FacultySubjectId are required");
    }

    const {
        faculty_id,
        subject_id,
        class_id,
        batch_code = "",
        formType
    } = req.body;

    if (!faculty_id || !subject_id || !formType) {
        throw new ApiError(400, "faculty, subject and formType are required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const subject = await Subject.findById(subject_id);
    if (!subject) {
        throw new ApiError(404, "Subject not found");
    }

    if (formType !== "theory" && subject.type !== "elective" && !batch_code) {
        throw new ApiError(400, "batch_code is required");
    }

    const faculty = await Faculty.findById(faculty_id).populate("user_id", "fullname");
    if (!faculty) {
        throw new ApiError(404, "Faculty not found");
    }

    let classSectionId = null;

    if (subject.type === "dept") {
        if (!class_id) {
            throw new ApiError(400, "class_id is required for core subjects");
        }

        const classSection = await ClassSection.findById(class_id);
        if (!classSection) {
            throw new ApiError(404, "ClassSection not found");
        }

        classSectionId = classSection._id;
    }

    const existingFacultySubject = await FacultySubject.exists({
        faculty: faculty._id,
        subject: subject._id,
        class_id: classSectionId,
        batch_code: batch_code,
        formType
    });

    if (existingFacultySubject) {
        throw new ApiError(409, "Faculty is already this subject to this class");
    }

    const facultySubject = await FacultySubject.findByIdAndUpdate(
        facultySubjectId,
        {
            faculty: faculty._id,
            subject: subject._id,
            class_id: classSectionId,
            batch_code: batch_code,
            formType,
            facultyName: faculty.user_id.fullname
        }, { new: true });

    if (!facultySubject) {
        throw new ApiError(500, "Failed to update facultySubject");
    }

    return res.status(201).json(
        new ApiResponse(201, facultySubject, "FacultySubject updated successfully")
    );
});

//elective subject
export const addElectiveStudentsFromFile = asyncHandler(async (req, res) => {
    const { facultySubjectId } = req.params;

    if (!facultySubjectId) {
        throw new ApiError(400, "FacultySubjectId is required");
    }

    const facultySubject = await FacultySubject
        .findById(facultySubjectId)
        .populate("subject", "type year");

    if (!facultySubject) {
        throw new ApiError(404, "FacultySubject not found");
    }

    if (facultySubject.subject.type !== "elective") {
        throw new ApiError(400, "Only elective subjects support enrollment");
    }

    const file = req.file;
    if (!file) {
        throw new ApiError(400, "Excel file is required");
    }

    const studentData = await excelToJson(file);
    if (!studentData.length) {
        throw new ApiError(400, "Excel file is empty");
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const emails = studentData
            .map(s => s.email?.toLowerCase())
            .filter(Boolean);

        const studentUser = await User.find({ email: { $in: emails } });
        const userIds = studentUser.map((u) => u._id);

        const students = await Student.find({
            user_id: { $in: userIds }
        }).populate("user_id", "email").select("_id email academic_year");
        const studentMap = new Map(
            students.map(s => [s?.user_id?.email, { studentId: s._id, academic_year: s.academic_year }])
        );

        const existingEnrollments = await ElectiveEnrollment.find({
            facultySubject: facultySubjectId,
            student: { $in: students.map(s => s._id) }
        }).select("student");

        const enrolledSet = new Set(
            existingEnrollments.map(e => e?.student?.toString())
        );

        const newEnrollments = [];
        let skipped = 0;

        for (const row of studentData) {
            const email = row?.email?.toLowerCase();
            const studentEntry = studentMap.get(email);
            if (!studentEntry) {
                skipped++;
                continue;
            }

            const { studentId, academic_year } = studentEntry;
            // const studentYear = getStudentYear(academic_year)
            if (!studentId || !academic_year || enrolledSet.has(studentId.toString()) || facultySubject.subject.year !== getStudentYear(academic_year)) {
                skipped++;
                continue;
            }

            newEnrollments.push({
                facultySubject: facultySubjectId,
                student: studentId
            });
        }

        if (newEnrollments.length) {
            await ElectiveEnrollment.insertMany(newEnrollments, { session });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            data: {
                inserted: newEnrollments.length,
                skipped
            },
            message: "Elective students enrolled successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error instanceof ApiError) {
            throw error
        }
        throw new ApiError(500, "Failed to enroll elective students");
    }
});

export const addElectiveStudent = asyncHandler(async (req, res) => {
    const { facultySubjectId } = req.params;

    if (!facultySubjectId) {
        throw new ApiError(400, "FacultySubjectId is required");
    }

    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Student email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const facultySubject = await FacultySubject
        .findById(facultySubjectId)
        .populate("subject", "type year");

    if (!facultySubject) {
        throw new ApiError(404, "FacultySubject not found");
    }

    if (facultySubject.subject.type !== "elective") {
        throw new ApiError(400, "Only elective subjects support enrollment");
    }

    const studentYear = getStudentYear(student.academic_year);
    if (facultySubject.subject.year !== studentYear) {
        throw new ApiError(
            400,
            "Student academic year does not match elective subject year"
        );
    }

    const alreadyEnrolled = await ElectiveEnrollment.findOne({
        facultySubject: facultySubjectId,
        student: student._id
    });

    if (alreadyEnrolled) {
        throw new ApiError(400, "Student already enrolled in this elective");
    }

    const createdElectiveEnrollment = await ElectiveEnrollment.create({
        student: student._id,
        facultySubject: facultySubject._id
    });

    if (!createdElectiveEnrollment) {
        throw new ApiError(500, "Failed to create elective enrollment");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            createdElectiveEnrollment,
            "Successfully created elective enrollment"
        )
    );
});

export const getElectiveStudent = asyncHandler(async (req, res) => {
    const { facultySubjectId } = req.params;

    if (!facultySubjectId) {
        throw new ApiError(400, "FacultySubjectId is required");
    }

    const electives = await ElectiveEnrollment.find({
        facultySubject: facultySubjectId
    })
        .populate({
            path: "student",
            options: { sort: { roll_no: 1 } },
            populate: [
                { path: "user_id", select: "fullname email" },
                { path: "class_id", select: "name year" }
            ]
        })
        .select("student")

    if (!electives || electives.length === 0) {
        throw new ApiError(404, "No students found for this elective");
    }

    const students = electives.map(e => ({
        _id: e._id,
        student: e.student,
    }));

    return res.status(200).json(
        new ApiResponse(200, students, "Elective students fetched successfully")
    );
});

export const deleteElectiveStudents = asyncHandler(async (req, res) => {
    const { elective_ids } = req.body;

    if (!Array.isArray(elective_ids) || elective_ids.length === 0) {
        throw new ApiError(400, "elective_ids array is required");
    }

    const result = await ElectiveEnrollment.deleteMany({
        _id: { $in: elective_ids }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                deletedCount: result.deletedCount
            },
            "Elective students deleted successfully"
        )
    );
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
        const defaultPassword = `${department.code.toLowerCase()}123`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const emails = studentData.map(s => s?.email?.toLowerCase());
        const existingUsers = await User.find(
            { email: { $in: emails } },
            { email: 1 }
        );

        const existingEmailSet = new Set(
            existingUsers.map(u => u.email)
        );

        const classNameYearMap = new Map();

        for (const s of studentData) {
            const year = getStudentYear(s.academic_year);
            const name = s.class_name;

            const key = `${year}_${name}`;
            if (!classNameYearMap.has(key)) {
                classNameYearMap.set(key, { year, name });
            }
        }

        const classes = Array.from(classNameYearMap.values());
        const classSections = await ClassSection.find({
            dept: dept_id,
            $or: classes
        });

        if (classSections.length === 0) {
            throw new ApiError(404, "No matching classes found for department");
        }

        const classMap = new Map();
        classSections.forEach(cs => {
            classMap.set(`${cs?.year}_${cs?.name}`, {
                class_id: cs?._id,
                strength: cs?.strength
            });
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
            const { class_id, strength } = classMap.get(key);

            if (!class_id || !strength) {
                skipped++;
                continue;
            }

            const userId = new mongoose.Types.ObjectId();

            newUsers.push({
                _id: userId,
                fullname: s.fullname,
                email,
                password: hashedPassword,
                role: "student",
                institute: department.institute
            });

            if (Number(strength) < Number(s.roll_no)) {
                throw new ApiError(400, "Roll no cannot be more than class strength");
            }

            newStudents.push({
                user_id: userId,
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

        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to upload students");
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

    const password = department.code.toLowerCase() + "123";

    const studentUser = await User.create({
        email,
        fullname,
        password: password,
        role: "student",
        institute: department.institute
    });

    const classSection = await ClassSection.findOne({
        name: class_name,
        year: getStudentYear(academic_year),
        dept: department._id,
        strength: { $gte: roll_no },
    });

    if (!classSection) {
        throw new ApiError(404, "ClassSection not found");
    }

    const student = await Student.create({
        user_id: studentUser._id,
        // dept: department._id,
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
        throw new ApiError(400, "DepartmentId is required");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const classes = await ClassSection.find(
        { dept: dept_id },
        { _id: 1 }
    );

    if (!classes.length) {
        throw new ApiError(404, "Classes not found");
    }

    const classIds = classes.map(cs => cs._id);

    const { year } = req.query;

    const matchQuery = {
        class_id: { $in: classIds }
    };

    if (["FY", "SY", "TY", "BY"].includes(year)) {
        matchQuery.academic_year = getStudentAcademicYear(year);
    }
    const departmentStudents = await Student.aggregate([
        {
            $match: matchQuery
        },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $lookup: {
                from: "classsections",
                localField: "class_id",
                foreignField: "_id",
                as: "class"
            }
        },
        { $unwind: "$class" },
        {
            $sort: {
                academic_year: 1,
                "class.name": 1,
                roll_no: 1
            }
        },
        {
            $project: {
                _id: 1,
                roll_no: 1,
                academic_year: 1,
                "class.name": 1,
                "user.fullname": 1,
                "user.email": 1
            }
        }
    ]);

    if (!departmentStudents.length) {
        throw new ApiError(404, "Department students not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            departmentStudents,
            "Successfully fetched department students"
        )
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
        dept: department._id,
        strength: { $gte: roll_no }
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
                    institute: department.institute
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
        if (error instanceof ApiError) {
            throw error
        }
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

    const password = "faculty123";
    const facultyUser = await User.create({
        email,
        fullname,
        password: password,
        role: "faculty",
        institute: department.institute
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

    const updatedFacultySubject = await FacultySubject.updateMany(
        { faculty: faculty_id },
        {
            $set: {
                facultyName: fullname,
            },
        }, {
        new: true
    });

    if (!updatedFacultySubject) {
        throw new ApiError(500, "Failed to update facultySubject data");
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
            dept: dept_id,
            semester: sub.semester
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

    if (!year || !name || !strength || !Array.isArray(batches) || batches.length === 0) {
        throw new ApiError(400, "Year, name, batches and strength are required");
    }
    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const seenBatch = new Set();
    const rangesByType = {
        practical: [],
        tutorial: []
    };

    for (const batch of batches) {
        const key = `${batch.type}_${batch.code}`;

        if (seenBatch.has(key)) {
            throw new ApiError(400, "batch must have unique type_code");
        }
        seenBatch.add(key);

        if (!["practical", "tutorial"].includes(batch.type)) {
            throw new ApiError(
                400,
                "batch must have valid type (practical | tutorial)"
            );
        }

        const { from, to } = batch.rollRange || {};
        const fromNum = Number(from);
        const toNum = Number(to);
        const strengthNum = Number(strength);

        if (
            Number.isNaN(fromNum) ||
            Number.isNaN(toNum) ||
            fromNum >= toNum ||
            toNum > strengthNum
        ) {
            throw new ApiError(400, "batch must have valid rollRange");
        }

        for (const existing of rangesByType[batch.type]) {
            const overlap =
                from <= existing.to && to >= existing.from;

            if (overlap) {
                throw new ApiError(
                    400,
                    `Overlapping roll range in ${batch.type} ${batch.code} batch (${from}-${to})`
                );
            }
        }
        rangesByType[batch.type].push({ from, to });
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

    const { year, name, strength, batches } = req.body;

    if (!year || !name || !strength || !Array.isArray(batches) || batches.length === 0) {
        throw new ApiError(400, "Year, name, strength and batches are required");
    }
    const strengthNum = Number(strength);

    if (strengthNum <= 0 || strengthNum > 100) {
        throw new ApiError(400, "Invalid strength");
    }

    const department = await Department.findById(dept_id);
    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    const seenBatch = new Set();
    const rangesByType = {
        practical: [],
        tutorial: []
    };

    for (const batch of batches) {
        const key = `${batch.type}_${batch.code}`;

        if (seenBatch.has(key)) {
            throw new ApiError(400, "batch must have unique type_code");
        }
        seenBatch.add(key);

        if (!["practical", "tutorial"].includes(batch.type)) {
            throw new ApiError(
                400,
                "batch must have valid type (practical | tutorial)"
            );
        }

        const { from, to } = batch.rollRange || {};
        const fromNum = Number(from);
        const toNum = Number(to);

        if (
            Number.isNaN(fromNum) ||
            Number.isNaN(toNum) ||
            fromNum >= toNum ||
            toNum > strengthNum
            || fromNum <= 0 || toNum <= 0
        ) {
            throw new ApiError(400, "batch must have valid rollRange");
        }

        for (const existing of rangesByType[batch.type]) {
            const overlap =
                from <= existing.to && to >= existing.from;

            if (overlap) {
                throw new ApiError(
                    400,
                    `Overlapping roll range in ${batch.type} ${batch.code} batch (${from}-${to})`
                );
            }
        }
        rangesByType[batch.type].push({ from, to });
    }

    const updatedClass = await ClassSection.findByIdAndUpdate(
        class_id,
        {
            $set: {
                year,
                name,
                strength,
                batches
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

export const deleteClass = asyncHandler(async (req, res) => {
    const { class_id } = req.params;
    if (!class_id) {
        throw new ApiError(403, "DepartmentId and ClassId are required");
    }

    await ClassSection.findByIdAndDelete(class_id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Successfully deleted class data")
    );
});
