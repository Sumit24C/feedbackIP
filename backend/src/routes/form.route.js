import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import {
    createForm,
    deleteForm,
    getFormById,
    getFormsByDept,
    updateForm
} from "../controllers/form.controller.js";
const router = Router();
router.use(verifyJWT, verifyRole("admin", "faculty"));
router.route("/").post(createForm).get(getFormsByDept);
router.route("/:form_id").put(updateForm).delete(deleteForm).get(getFormById);

export default router;