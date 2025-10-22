// import { Router } from "express"
// import { verifyJWT } from "../middlewares/auth.middleware.js"
// import { createForm } from "../controllers/form.controller.js"
// import { verifyRole } from "../middlewares/role.middleware.js";

// const routes = Router();
// routes.use(verifyJWT, verifyRole("faculty"));
// routes.post("/", createForm);

// export default routes;

import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { loginUser, logoutUser } from "../controllers/user.controller.js";
const router = Router();
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT, logoutUser);

export default router;