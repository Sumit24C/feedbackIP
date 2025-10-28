import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import { createForm, createQuestionTemplate, deleteForm, getFormsByDept, updateForm } from "../controllers/form.controller.js";
const router = Router();
router.use(verifyJWT, verifyRole("admin", "faculty"));
router.route("/:dept_id").post(createForm).get(getFormsByDept);
router.route("/q/:dept_id").post(createQuestionTemplate);
router.route("/:form_id").put(updateForm).delete(deleteForm);

export default router;