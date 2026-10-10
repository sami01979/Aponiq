import { Router } from "express";
import { registerCenter, login, logout, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register-center", registerCenter);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, me);

export default router;