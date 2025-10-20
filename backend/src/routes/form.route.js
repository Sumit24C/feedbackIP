import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { createForm } from "../controllers/form.controller.js"
import { verifyRole } from "../middlewares/role.middleware.js";

const routes = Router();
routes.use(verifyJWT, verifyRole("faculty"));
routes.post("/", createForm);

export default routes;