import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    addFaculty,
    addStudents,
    createDepartment,
    deleteDepartment,
    editDepartment,
    getDepartmentById,
    getDepartments,
    getFacultyByDept,
    getStudentsByDept
} from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyRole } from "../middlewares/role.middleware.js";
const router = Router();
router.use(verifyJWT, verifyRole("admin"));

router.post("/", upload.fields([
    { name: "students", maxCount: 1 },
    { name: "faculties", maxCount: 1 }
]), createDepartment);

router.route("/").get(getDepartments);

router.route("/add-students/:dept_id").post(upload.single('student'), addStudents);
router.route("/add-faculties/:dept_id").post(upload.single('faculty'), addFaculty);
router.route("/:dept_id").get(getDepartmentById).put(editDepartment).delete(deleteDepartment);
router.route("/student/:dept_id").get(getStudentsByDept);
router.route("/faculty/:dept_id").get(getFacultyByDept);

export default router;