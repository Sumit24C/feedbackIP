import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getFeedbackResult } from "../controllers/faculty.controller.js"
import { verifyRole } from "../middlewares/role.middleware.js";

const routes = Router();
routes.use(verifyJWT, verifyRole("faculty"));
routes.get("/feedback-result", getFeedbackResult);

export default routes;