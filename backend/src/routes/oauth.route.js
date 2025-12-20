import { Router } from "express";
import passport from "passport";
import { accessTokenExpiry, refreshTokenExpiry, COOKIE_OPTIONS } from "../constants.js";
import { User } from "../models/user.model.js";

const router = Router();

router.route("/google").get(
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
)

router.route("/google/callback").get(
    passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/no-access" }),
    async (req, res) => {
        try {
            const accessToken = req.user.generateAccessToken()
            const refreshToken = req.user.generateRefreshToken()

            const user = await User.findByIdAndUpdate(req.user?._id, {
                $set: { refreshToken: refreshToken },
            }, { new: true })

            res.status(200).cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: accessTokenExpiry })
                .cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: refreshTokenExpiry })
                .redirect(`${process.env.CORS_ORIGIN}`)
        } catch (err) {
            console.error("google login :: error :: ", err)
            res.redirect(`${process.env.CORS_ORIGIN}/login?error=google_failed`)
        }
    })

router.get("/google/no-access", (req, res) => {
    return res.redirect(`${process.env.CORS_ORIGIN}/no-access`)
})

export default router