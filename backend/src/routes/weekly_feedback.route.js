import { Router } from "express";
import { cronAuth } from "../middlewares/cronAuth.middleware.js";
import { finalizeExpiredForms, getWeeklyFeedback } from "../controllers/weekly_feedback.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRole } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/").post(cronAuth, finalizeExpiredForms);
router.route("/:facultySubjectId").get(verifyJWT, verifyRole("faculty"), getWeeklyFeedback);

export default router;
