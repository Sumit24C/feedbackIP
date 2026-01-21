import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
// import client from "prom-client";
// import responseTime from "response-time";
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
    app.use("/api", morgan("dev"));
}

const limiter = rateLimit({
    limit: 1000,
    windowMs: 60 * 60 * 1000,
    message: "We have recieved too many requests. please try after one hour."
});

// const collectDefaultMetric = client.collectDefaultMetrics;
// collectDefaultMetric({
//     register: client.register
// });

// const reqResTime = new client.Histogram({
//     name: "http_express_req_res_time",
//     help: "This will tell how much time is taken by req and res",
//     labelNames: ["method", "route", "statusCode"],
//     buckets: [1, 50, 100, 200, 400, 500, 600, 700, 800, 1000, 2000],
// });

// const totalReqCounter = new client.Counter({
//     name: "total_req",
//     help: "Tells total req"
// });

// app.use(responseTime((req, res, time) => {
//     if (req?.route?.path !== "/metrics") {
//         console.log(req.res.statusCode);
//     }
//     totalReqCounter.inc();
//     reqResTime.labels({
//         method: req.method,
//         route: req.url,
//         statusCode: req.res.statusCode
//     }).observe(time);
// }));

import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import facultyRoutes from "./routes/faculty.route.js";
import studentRoutes from "./routes/student.route.js";
import formRoutes from "./routes/form.route.js";
import oAuthRoutes from "./routes/oauth.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import weeklyFeedbackRoutes from "./routes/weekly_feedback.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";

app.use("/api", limiter);
app.use("/api/user", userRoutes);
app.use("/api/auth", oAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/form", formRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/weekly-feedback", weeklyFeedbackRoutes);

// app.get("/metrics", asyncHandler(async (req, res) => {
//     res.setHeader("Content-Type", client.register.contentType);
//     const metrics = await client.register.metrics();
//     res.send(metrics);
// }));

app.get("/", (req, res) => {
    res.send({ message: "server working" })
});

app.use(errorHandler)
export { app }