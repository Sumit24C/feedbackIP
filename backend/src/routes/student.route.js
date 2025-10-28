import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getForm, submitResponse } from "../controllers/student.controller.js";
const router = Router();
router.use(verifyJWT);
router.route("/:form_id").get(getForm).post(submitResponse);

export default router;