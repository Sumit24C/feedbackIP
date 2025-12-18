import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    addFacultyFile,
    addStudentFile,
    addSubjectFile,
    createDept,
    deleteDepartment,
    editDepartment,
    getDepartmentById,
    getDepartments,
    getFacultyByDept,
    getStudentsByDept,
    uploadFacultySubjects
} from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyRole } from "../middlewares/role.middleware.js";
const router = Router();
router.use(verifyJWT, verifyRole("admin"));

router.post("/", upload.fields([
    { name: "students", maxCount: 1 },
    { name: "faculties", maxCount: 1 },
    { name: "subjects", maxCount: 1 },
]), createDept);
router.route("/").get(getDepartments);

router.post("/faculty-subjects", upload.single("facultysubjects"), uploadFacultySubjects);

router.route("/add-students/:dept_id").post(upload.single('students'), addStudentFile);
router.route("/add-faculties/:dept_id").post(upload.single('faculties'), addFacultyFile);
router.route("/add-subjects/:dept_id").post(upload.single('subjects'), addSubjectFile);
router.route("/:dept_id").get(getDepartmentById).put(editDepartment).delete(deleteDepartment);
router.route("/student/:dept_id").get(getStudentsByDept);
router.route("/faculty/:dept_id").get(getFacultyByDept);

export default router;