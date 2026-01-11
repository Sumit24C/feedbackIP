import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import {
    getDepartmentClass,
    getFeedbackResultByClass,
    getFeedbackResultBySubjects,
    getOverallFeedbackResult,
    getSubjectMapping
} from "../controllers/faculty.controller.js";

const router = Router();
router.use(verifyJWT, verifyRole("faculty"));

router.route("/:form_id").get(getSubjectMapping);
router.route("/class/:form_id").get(getDepartmentClass);

router.route("/subject/:form_id/:fs_id").get(getFeedbackResultBySubjects);
router.route("/class/:form_id/:class_id").get(getFeedbackResultByClass);

router.route("/overall-result/:form_id").get(getOverallFeedbackResult);

export default router;