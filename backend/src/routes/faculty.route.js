import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import { getForm, submitResponse } from "../controllers/student.controller.js";
import { getAllQuestionTemplates, getFeedbackResultBySubjects, getOverallFeedbackResult, getQuestionTemplateById, getSubjectMapping } from "../controllers/faculty.controller.js";

const router = Router();
router.use(verifyJWT, verifyRole("faculty"));
router.route("/").get(getSubjectMapping);
router.route("/overall-result/:form_id").get(getOverallFeedbackResult);
router.route("/s/:form_id/:subject_mapping_id").get(getFeedbackResultBySubjects);
router.route("/q/:dept_id").get(getAllQuestionTemplates);
router.route("/q/:dept_id/:question_template_id").get(getQuestionTemplateById);

export default router;