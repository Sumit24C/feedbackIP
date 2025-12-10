import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import {
    createAttendance,
    getClassStudent,
    getFacultyClassByFacultyId,
    getStudentAttendanceByClassSection,
    getStudentAttendanceByFacultyId,
    getStudentAttendanceByStudentId,
    getStudentAttendanceBySubject,
} from "../controllers/attendance.controller.js";

const router = Router();
router.use(verifyJWT);
router.route('/:faculty_subject').post(verifyRole("faculty"), createAttendance).get(verifyRole("faculty"), getFacultyClassByFacultyId);
router.route('/f').get(verifyRole("faculty"), getClassStudent);
router.route('/s').get(verifyRole("student"), getStudentAttendanceByStudentId);
router.route('/s/:subject/:formType').get(verifyRole("student"), getStudentAttendanceBySubject);
router.route('/f/s').get(verifyRole("faculty"), getStudentAttendanceByFacultyId);
router.route('/f/s/:faculty_subject').get(verifyRole("faculty"), getStudentAttendanceByClassSection);

export default router