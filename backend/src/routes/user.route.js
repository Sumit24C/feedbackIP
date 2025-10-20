import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { login, logout } from "../controllers/user.controller.js"

const routes = Router();
routes.use();
routes.post("/login", login);
routes.get("/logout", verifyJWT, logout);

export default routes;