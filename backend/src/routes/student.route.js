import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { submitResponse } from "../controllers/student.controller.js"
import { verifyRole } from "../middlewares/role.middleware.js";

const routes = Router();
routes.use(verifyJWT, verifyRole("student"));
routes.post("/", submitResponse);

export default routes;