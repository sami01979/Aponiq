import { Router } from "express";
import {
  markAttendance,
  getBatchAttendance,
  studentAttendance,
} from "../controllers/attendance.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = Router();

router.use(protect);

router.post("/", authorize("admin", "teacher"), markAttendance);
router.get("/", authorize("admin", "teacher"), getBatchAttendance);
router.get("/student/:studentId", authorize("admin", "parent"), studentAttendance);

export default router;