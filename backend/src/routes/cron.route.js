import { Router } from "express";
import { cronAuth } from "../middlewares/cronAuth.middleware.js";
import { finalizeExpiredForms } from "../controllers/weekly_feedback.controller.js";

const router = Router();

router.route("/weekly-feedback").post(cronAuth, finalizeExpiredForms);

export default router;
