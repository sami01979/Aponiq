import { Router } from "express";
import {
  createStudent,
  listStudents,
  myChildren,
  getStudent,
  updateStudent,
} from "../controllers/student.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = Router();

router.use(protect);


router.get("/my", authorize("parent"), myChildren);

router.route("/").post(authorize("admin"), createStudent).get(authorize("admin", "teacher"), listStudents);

router
  .route("/:id")
  .get(authorize("admin", "teacher"), getStudent)
  .patch(authorize("admin"), updateStudent);

export default router;