/*
1️⃣ Find Students With Conditional Nested Matches

You have a Student collection and an Attendance collection where each attendance document contains an array students with fields { student: ObjectId, isPresent: Boolean }.

Problem:
Write a Mongoose query that returns all students who have 80% or higher attendance in DBMS theory classes.

*/
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { FacultySubject } from "../models/faculty_subject.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Student } from "../models/student.model.js";
import { getStudentAcademicYear } from "../utils/getStudentAcademicYear.js";
import mongoose from "mongoose";

async function practice(req, res) {
    const student = await Attendance.aggregate([
        {
            $unwind: "$students"
        },
        {
            $lookup: {
                from: "students",
                localField: "$students.student",
                foreignField: "_id",
                as: "studentUser",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user"
                        },
                    },
                    {
                        $unwind: "$user"
                    },
                    {
                        $project: {
                            roll_no: 1,
                            classSection: 1,
                            dept: 1,
                            fullname: "$user.fullname"
                        }
                    }
                ]
            }
        },
        { $unwind: "$studentUser" },
        {
            $group: {
                _id: "$students.student",
                student: "$students.student",
                fullname: { $first: "$studentUser.fullname" },
                roll_no: { $first: "$studentUser.roll_no" },
                classSection: { $first: "$studentUser.classSection" },
                dept: { $first: "$studentUser.dept" },
                totalPresent: {
                    $sum: {
                        $cond: {
                            if: "$students.isPresent",
                            then: 1,
                            else: 0
                        }
                    }
                },
                totalClassess: {
                    $sum: 1
                },
            }
        },
        {
            $addFields: {
                totalPercentage: {
                    $cond: {
                        if: { $eq: ["$totalClassess", 0] },
                        then: 0,
                        else: {
                            $multiply: [
                                { $divide: ["$totalPresent", "$totalClassess"] },
                                100
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                "totalPercentage": { $ge: 80 }
            }
        },
        {
            $project: {
                student: 1,
                totalClassess: 1,
                totalPresent: 1,
                totalPercentage: 1,
                fullname: 1,
                //rest other fields
            }
        }
    ])

    const { page, limit } = req.query;
    let pageNumber = parseInt(page);
    let limitNumber = parseInt(limit);

    const post = Post.aggregate([
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (pageNumber - 1) * limitNumber
        },
        {
            $limit: limitNumber
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$author" },
        {
            $addFields: {
                wordCount: {
                    $size: { $split: ["$content", " "] }
                }
            }
        },
        {
            $project: {
                title: 1,
                content: 1,
                wordCount: 1,
                author: 1,
                createdAt: 1
            }
        }

    ])

    const orders = Attendance.updateMany(
        {
            status: "pending",
            totalAmount: { $gt: 500 }
        },
        {
            $set: {
                status: "packed",
                updatedAt: new Date(),
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            $mergeObjects: [
                                "$$item",
                                {
                                    price: {
                                        $multiply: ["$$item.price", 1.05]
                                    }
                                }
                            ]

                        }
                    }
                }
            }
        },
        {
            new: true
        }
    )
}