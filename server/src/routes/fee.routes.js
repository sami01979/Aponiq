import { Router } from "express";
import { generateFees, listFees, recordPayment, studentFees } from "../controllers/fee.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = Router();

router.use(protect);

router.get("/student/:studentId", authorize("admin", "parent"), studentFees);

router.post("/generate", authorize("admin"), generateFees);
router.get("/", authorize("admin"), listFees);
router.post("/:id/pay", authorize("admin"), recordPayment);

export default router;