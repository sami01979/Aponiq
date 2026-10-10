import { Router } from "express";
import { listCenters, updateCenter } from "../controllers/superadmin.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = Router();

router.use(protect, authorize("superadmin"));

router.get("/centers", listCenters);
router.patch("/centers/:id", updateCenter);

export default router;