import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verifyRole } from "../middlewares/role.middleware.js"
import { createDepartment } from "../controllers/admin.controller.js"

const routes = Router();
routes.use(verifyJWT, verifyRole("admin"));
routes.post("/", createDepartment);

export default routes;