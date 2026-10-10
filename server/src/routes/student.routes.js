import { Router } from "express";
import {
  createStudent,
  listStudents,
  myChildren,
  getStudent,
  updateStudent,
  studentUsage,
} from "../controllers/student.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = Router();

router.use(protect);

// These must come before "/:id"
router.get("/my", authorize("parent"), myChildren);
router.get("/usage", authorize("admin"), studentUsage);

router.route("/").post(authorize("admin"), createStudent).get(authorize("admin", "teacher"), listStudents);

router
  .route("/:id")
  .get(authorize("admin", "teacher"), getStudent)
  .patch(authorize("admin"), updateStudent);

export default router;