import { Router } from "express";
import {
  createBatch,
  listBatches,
  getBatch,
  updateBatch,
  enrollStudent,
  batchStudents,
  updateEnrollment,
} from "../controllers/batch.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = Router();

router.use(protect);

router.patch("/enrollments/:id", authorize("admin"), updateEnrollment);

router.route("/").post(authorize("admin"), createBatch).get(authorize("admin", "teacher"), listBatches);

router
  .route("/:id")
  .get(authorize("admin", "teacher"), getBatch)
  .patch(authorize("admin"), updateBatch);

router.post("/:id/enroll", authorize("admin"), enrollStudent);
router.get("/:id/students", authorize("admin", "teacher"), batchStudents);

export default router;