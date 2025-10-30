import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import { deleteQuestionTemplateById, getAllQuestionTemplates, getFeedbackResultBySubjects, getOverallFeedbackResult, getQuestionTemplateById, getSubjectMapping } from "../controllers/faculty.controller.js";

const router = Router();
router.use(verifyJWT, verifyRole("faculty"));
router.route("/q").get(getAllQuestionTemplates);
router.route("/:form_id").get(getSubjectMapping);
router.route("/overall-result/:form_id").get(getOverallFeedbackResult);
router.route("/s/:form_id/:subject_mapping_id").get(getFeedbackResultBySubjects);
router.route("/q/:question_template_id").get(getQuestionTemplateById).delete(deleteQuestionTemplateById);

export default router;