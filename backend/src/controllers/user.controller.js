import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Student } from "../models/student.model.js"
import { Faculty } from "../models/faculty.model.js";
import { accessTokenExpiry, refreshTokenExpiry, COOKIE_OPTIONS } from "../constants.js";

export const registerAdmin = asyncHandler(async (req, res) => {
    const { fullname, email, password, role } = req.body;

    if ([fullname, email, password, role].some(
        (field) => !field || field?.trim() === ""
    )) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ email: email });

    if (existedUser) {
        throw new ApiError(409, "User alreadt exists");
    }

    const user = await User.create({
        email, fullname, role, password
    });

    if (!user) {
        throw new ApiError(500, "Failed to create user");
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
            new ApiResponse(200, { admin: loggedInUser }, "successfully register")
        );
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

    const isPasswordCorrect = await user.isPasswordCorrect(password, user.password);
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
        user = await Student.findOne({ user_id: req.user._id }).populate("dept", "name");
    } else if (userRole === "faculty") {
        user = await Faculty.findOne({ user_id: req.user._id }).populate("dept", "name");
    }

    return res.status(200)
        .json(new ApiResponse(200, user, "user info fetched successfully"))
});

