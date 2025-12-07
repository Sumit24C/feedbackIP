import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { User } from "../models/user.model.js";
import { OAuth } from "../models/oauth.model.js";

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const email = profile.emails[0].value;

                const existingAccount = await OAuth.findOne({
                    provider: "google",
                    provider_account_id: googleId,
                })

                if (existingAccount) {
                    const user = await User.findById(existingAccount.user);
                    return done(null, user);
                }

                let user = await User.findOne({ email });

                if (!user) {
                    return done(null, false, { message: "NOT_IN_SYSTEM" })
                }

                const oauth_user = await OAuth.create({
                    user: user._id,
                    provider: "google",
                    provider_account_id: googleId,
                });

                return done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
)

export default passport