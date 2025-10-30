import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getForms, getFormById, submitResponse } from "../controllers/student.controller.js";
const router = Router();
router.use(verifyJWT);
router.route("/").get(getForms);
router.route("/:form_id").get(getFormById).post(submitResponse);

export default router;