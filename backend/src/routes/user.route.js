import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getCurrentUser, getProfileInfo, loginUser, logoutUser, refreshAccessToken, registerAdmin, updatePassword } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(registerAdmin);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/update-password").post(verifyJWT, updatePassword);
router.route('/refresh-token').get(refreshAccessToken);
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/user-profile').get(verifyJWT, getProfileInfo);

export default router;