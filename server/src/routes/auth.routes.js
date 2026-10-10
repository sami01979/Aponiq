import { Router } from "express";
import { registerCenter, login, logout, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register-center", registerLimiter, registerCenter);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, me);

export default router;