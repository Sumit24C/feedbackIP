import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Student } from "../models/student.model.js"
import { Faculty } from "../models/faculty.model.js";
import { Admin } from "../models/admin.model.js";
import { Institute } from "../models/institute.model.js";
import { accessTokenExpiry, refreshTokenExpiry, COOKIE_OPTIONS } from "../constants.js";

export const registerInstitute = asyncHandler(async (req, res) => {
    const {
        instituteName,
        instituteCode,
        emailDomain,
        fullname,
        email,
        password
    } = req.body;

    if (
        [instituteName, instituteCode, fullname, email, password].some(
            (f) => !f || f.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const existedInstitute = await Institute.findOne({
        $or: [
            { name: instituteName },
            { code: instituteCode },
            emailDomain ? { emailDomain } : null
        ].filter(Boolean)
    });

    if (existedInstitute) {
        throw new ApiError(409, "Institute already exists");
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const institute = await Institute.create(
            [{
                name: instituteName,
                code: instituteCode,
                emailDomain,
            }],
            { session }
        );

        const user = await User.create(
            [{
                fullname,
                email,
                password,
                role: "admin",
            }],
            { session }
        );

        await Admin.create(
            [{
                institute: institute[0]._id,
                user_id: user[0]._id,
                permission: "institute",
            }],
            { session }
        );

        const accessToken = user[0].generateAccessToken();
        const refreshToken = user[0].generateRefreshToken();

        user[0].refreshToken = refreshToken;
        await user[0].save({ session, validateBeforeSave: false });

        await session.commitTransaction();
        session.endSession();

        const loggedInUser = await User.findById(user[0]._id)
            .select("-password -refreshToken");

        return res.status(201)
            .cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: accessTokenExpiry })
            .cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: refreshTokenExpiry })
            .json(
                new ApiResponse(201, { user: loggedInUser, }, "Institute registered successfully")
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("registerInstitute :: error", error);
        throw new ApiError(500, "Institute registration failed");
    }
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(401, "Invalid input");
    }

    const user = await User.findOne({ email: email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(403, "Invalid credentials");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(200)
        .cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: accessTokenExpiry })
        .cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: refreshTokenExpiry })
        .json(
            new ApiResponse(200, { user: loggedInUser }, "successfully login")
        )
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        }, {
        new: true
    })

    return res.status(200)
        .clearCookie("accessToken", { ...COOKIE_OPTIONS, maxAge: accessTokenExpiry })
        .clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: refreshTokenExpiry })
        .json(new ApiResponse(200, {}, "successfully logout"));
});

export const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(403, "Invalid current password");
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Password updated successfully")
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password");
    if (!user) {
        throw new ApiError(401, "invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const accessToken = user.generateAccessToken()

    res.status(200)
        .cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: accessTokenExpiry })
        .json(new ApiResponse(200, { user }, "Access token refreshed"))

});

export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user
    return res.status(200)
        .json(new ApiResponse(200, user, "current user fetched successfully"))
});

export const getProfileInfo = asyncHandler(async (req, res) => {
    const userRole = req.user.role;
    let user;
    if (userRole === "student") {
        user = await Student.findOne({ user_id: req.user._id }).populate("dept", "name").populate("class_id", "year name");
    } else if (userRole === "faculty") {
        user = await Faculty.findOne({ user_id: req.user._id }).populate("dept", "name");
    }

    return res.status(200)
        .json(new ApiResponse(200, user, "user info fetched successfully"))
});

