// import { Router } from "express"
// import { verifyJWT } from "../middlewares/auth.middleware.js"
// import { verifyRole } from "../middlewares/role.middleware.js"
// import { createDepartment } from "../controllers/admin.controller.js"

// const routes = Router();
// routes.use(verifyJWT, verifyRole("admin"));
// routes.post("/", createDepartment);

// export default routes;

import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addStudents, createDepartment } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();
router.use(verifyJWT);
router.route("/").post(createDepartment);
router.route("/add-students/:dept_id").post(upload.single('student'), addStudents);

export default router;