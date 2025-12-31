import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import {
    createForm,
    deleteForm,
    getAccessibleForms,
    getDepartments,
    getFacultyClassess,
    getFormById,
    updateForm
} from "../controllers/form.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/admin/dept").get(verifyRole("admin"), getDepartments);
router.route("/faculty/class").get(verifyRole("faculty"), getFacultyClassess);

router.use(verifyRole("faculty", "admin"));
router.route("/").post(createForm).get(getAccessibleForms);
router.route("/:form_id").put(updateForm).delete(deleteForm).get(getFormById);
export default router;