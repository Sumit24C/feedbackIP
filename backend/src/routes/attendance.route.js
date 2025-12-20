import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import {
    createAttendance,
    getClassStudent,
    updateAttendance,
    deleteAttendance,
    getFacultyClassByFacultyId,
    getStudentAttendanceByClassSection,
    getStudentAttendanceByFacultyId,
    getStudentAttendanceByStudentId,
    getStudentAttendanceBySubject,
    getClassByFacultySubject,
} from "../controllers/attendance.controller.js";

const router = Router();
router.use(verifyJWT);
router.route('/faculty/:faculty_subject').post(verifyRole("faculty"), createAttendance).get(verifyRole("faculty"), getFacultyClassByFacultyId);
router.route('/faculty/:attendance_id').patch(verifyRole("faculty"), updateAttendance);
router.route('/faculty/:attendance_id').delete(verifyRole("faculty"), deleteAttendance);
router.route('/faculty').get(verifyRole("faculty"), getClassStudent);
router.route('/student').get(verifyRole("student"), getStudentAttendanceByStudentId);
router.route('/student/:faculty_subject').get(verifyRole("student"), getStudentAttendanceBySubject);
router.route('/class/:faculty_subject').get(verifyRole("student"), getClassByFacultySubject);
router.route('/faculty/student').get(verifyRole("faculty"), getStudentAttendanceByFacultyId);
router.route('/faculty/student/:faculty_subject').get(verifyRole("faculty"), getStudentAttendanceByClassSection);

export default router