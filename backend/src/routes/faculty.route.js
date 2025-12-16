import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import {
    getFeedbackResultBySubjects,
    getOverallFeedbackResult,
    getSubjectMapping
} from "../controllers/faculty.controller.js";

const router = Router();
router.use(verifyJWT, verifyRole("faculty"));
router.route("/:form_id").get(getSubjectMapping);
router.route("/overall-result/:form_id").get(getOverallFeedbackResult);
router.route("/s/:form_id/:subject_mapping_id").get(getFeedbackResultBySubjects);

export default router;