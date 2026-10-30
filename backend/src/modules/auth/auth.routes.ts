import { loginUser, registerUser, refreshToken, getCurrentUser, logoutUser, updateUser  } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import {validate} from "../../middlewares/validate.middleware.js";
import { Router } from "express";
import { loginLimiter, refreshLimiter, registerLimiter } from "../../middlewares/rateLimit.middleware.js";

import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerLimiter, validate({ body: registerSchema }), registerUser);
// router.post("/login", loginLimiter, validate(loginSchema), loginUser);
router.post("/login", loginLimiter, validate({ body: loginSchema }), loginUser);
router.put("/me/update", authenticate, updateUser);
router.get("/me", authenticate, getCurrentUser);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logoutUser);
export default router;