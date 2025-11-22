import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import facultyRoutes from "./routes/faculty.route.js";
import studentRoutes from "./routes/student.route.js";
import formRoutes from "./routes/form.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/form", formRoutes);

app.use(errorHandler)
export { app }