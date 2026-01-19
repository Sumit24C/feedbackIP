import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

const limiter = rateLimit({
    limit: 1000,
    windowMs: 60 * 60 * 1000,
    message: "We have recieved too many requests. please try after one hour."
});

import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import facultyRoutes from "./routes/faculty.route.js";
import studentRoutes from "./routes/student.route.js";
import formRoutes from "./routes/form.route.js";
import oAuthRoutes from "./routes/oauth.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import weeklyFeedbackRoutes from "./routes/weekly_feedback.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";

if (process.env.NODE_ENV === "development") {
    app.use("/api", morgan("dev"));
}

app.use("/api", limiter);
app.use("/api/user", userRoutes);
app.use("/api/auth", oAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/form", formRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/weekly-feedback", weeklyFeedbackRoutes);

app.use(errorHandler)
export { app }