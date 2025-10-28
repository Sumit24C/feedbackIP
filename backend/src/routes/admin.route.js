import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addFaculty, addStudents, createDepartment, editDepartment, getDepartmentById, getDepartments, getFacultyByDept, getStudentsByDept } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyRole } from "../middlewares/role.middleware.js";
const router = Router();
router.use(verifyJWT, verifyRole("admin"));
router.route("/").post(createDepartment).get(getDepartments);
router.route("/add-students/:dept_id").post(upload.single('student'), addStudents);
router.route("/add-faculties/:dept_id").post(upload.single('faculty'), addFaculty);
router.route("/:dept_id").get(getDepartmentById).put(editDepartment);
router.route("/student/:dept_id").get(getStudentsByDept);
router.route("/faculty/:dept_id").get(getFacultyByDept);
router.route("/add-faculties/:dept_id").post(upload.single('faculty'), addFaculty);

export default router;