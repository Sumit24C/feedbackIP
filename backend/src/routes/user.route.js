import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { loginUser, logoutUser, registerAdmin, updatePassword } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(registerAdmin);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/update-password").get(verifyJWT, updatePassword);

export default router;