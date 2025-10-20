import { asyncHandler } from "../utils/asynHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
}

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(401, "invalid input");
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

    return res.status(200)
        .cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000 })
        .cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000 })
        .json(
            new ApiResponse(200, {}, "successfully login")
        )
})

export const updatePassword = asyncHandler(async (req, res) => {

})