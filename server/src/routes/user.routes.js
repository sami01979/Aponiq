import { Router } from "express";
import { createUser, listUsers, updateUser } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = Router();

router.use(protect, authorize("admin"));

router.route("/").post(createUser).get(listUsers);
router.patch("/:id", updateUser);

export default router;