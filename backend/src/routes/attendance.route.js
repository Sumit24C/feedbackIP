import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import {
    createAttendance,
    getClassStudent,
    updateAttendance,
    deleteAttendance,
    getFacultyClassByFacultyId,
    getStudentAttendanceByFacultyId,
    getStudentAttendanceByStudentId,
    getStudentAttendanceBySubject,
    getClassByFacultySubject,
    getStudentAttendanceByClass,
    getAllStudentAttendanceCountByClass,
} from "../controllers/attendance.controller.js";

const router = Router();
router.use(verifyJWT);

//faculty
router.route('/faculty').get(verifyRole("faculty"), getClassStudent);
router.route('/faculty/student').get(verifyRole("faculty"), getStudentAttendanceByFacultyId);
router.route('/faculty/a/:attendance_id').patch(verifyRole("faculty"), updateAttendance);
router.route('/faculty/a/:attendance_id').delete(verifyRole("faculty"), deleteAttendance);
router.route('/faculty/student/:faculty_subject').post(verifyRole("faculty"), createAttendance).get(verifyRole("faculty"), getFacultyClassByFacultyId);
router.route('/faculty/student/class/:faculty_subject').get(verifyRole("faculty"), getStudentAttendanceByClass);
router.route('/faculty/student/summary/:faculty_subject').get(verifyRole("faculty"), getAllStudentAttendanceCountByClass);

//student
router.route('/student').get(verifyRole("student"), getStudentAttendanceByStudentId);
router.route('/student/:faculty_subject').get(verifyRole("student"), getStudentAttendanceBySubject);

router.route('/class/:faculty_subject').get(verifyRole("student"), getClassByFacultySubject);
export default router