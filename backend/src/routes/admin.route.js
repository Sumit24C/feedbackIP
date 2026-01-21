import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    addClass,
    addClassFile,
    addElectiveStudent,
    addElectiveStudentsFromFile,
    addFaculty,
    addFacultyFile,
    addFacultySubjects,
    addStudent,
    addStudentFile,
    addSubject,
    addSubjectFile,
    createDepartment,
    deleteClass,
    deleteDepartment,
    deleteElectiveStudents,
    editDepartment,
    getClassesByDept,
    getDepartmentById,
    getDepartments,
    getElectiveStudent,
    getFacultiesByDept,
    getFacultySubjectMeta,
    getFacultySubjectsByDepartmentId,
    getStudentsByDept,
    getSubjectsByDept,
    updateClass,
    updateFaculty,
    updateFacultySubject,
    updateStudent,
    updateSubject,
    uploadFacultySubjects
} from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyRole } from "../middlewares/role.middleware.js";

const router = Router();
router.use(verifyJWT, verifyRole("admin"));

router.route("/").post(upload.fields([
    { name: "faculties", maxCount: 1 },
    { name: "subjects", maxCount: 1 },
    { name: "classes", maxCount: 1 },
]), createDepartment).get(getDepartments);

router.post("/add-faculty-subjects/:dept_id", upload.single("facultysubjects"), uploadFacultySubjects);
router.get("/faculty-subjects/meta/:dept_id", getFacultySubjectMeta);

router.route("/add-students/:dept_id").post(upload.single('students'), addStudentFile);
router.route("/add-faculties/:dept_id").post(upload.single('faculties'), addFacultyFile);
router.route("/add-subjects/:dept_id").post(upload.single('subjects'), addSubjectFile);
router.route("/add-classes/:dept_id").post(upload.single('classess'), addClassFile);
router.route("/add-electives/:facultySubjectId").post(upload.single('students'), addElectiveStudentsFromFile);

router.route("/:dept_id").get(getDepartmentById).put(editDepartment).delete(deleteDepartment);

router.route("/students/:dept_id").get(getStudentsByDept).post(addStudent);
router.route("/faculty-subjects/:dept_id").get(getFacultySubjectsByDepartmentId).post(addFacultySubjects);
router.route("/electives/:facultySubjectId").get(getElectiveStudent).post(addElectiveStudent);
router.route("/faculties/:dept_id").get(getFacultiesByDept).post(addFaculty);
router.route("/subjects/:dept_id").get(getSubjectsByDept).post(addSubject);
router.route("/classes/:dept_id").get(getClassesByDept).post(addClass);

router.route("/student/:dept_id/:student_id").patch(updateStudent);
router.route("/faculty/:dept_id/:faculty_id").patch(updateFaculty);
router.route("/subject/:dept_id/:subject_id").patch(updateSubject);
router.route("/class/:dept_id/:class_id").patch(updateClass);
router.route("/faculty-subject/:dept_id/:facultySubjectId").patch(updateFacultySubject);
router.route("/electives/students").delete(deleteElectiveStudents);

router.route("/class/:class_id").delete(deleteClass);

router.route()
export default router;