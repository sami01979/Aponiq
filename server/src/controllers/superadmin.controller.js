import Center from "../models/Center.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { PLANS, PLAN_KEYS } from "../config/plans.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/superadmin/centers?status=pending
export const listCenters = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const centers = await Center.find(filter).sort({ createdAt: -1 });
  const ids = centers.map((c) => c._id);

  const admins = await User.find({ role: "admin", center: { $in: ids } }).select("name phone center");
  const adminByCenter = {};
  admins.forEach((a) => {
    if (!adminByCenter[a.center]) adminByCenter[a.center] = a;
  });

  const counts = await Student.aggregate([
    { $match: { center: { $in: ids }, isActive: true } },
    { $group: { _id: "$center", n: { $sum: 1 } } },
  ]);
  const countByCenter = {};
  counts.forEach((c) => (countByCenter[c._id] = c.n));

  res.json({
    success: true,
    count: centers.length,
    centers: centers.map((c) => {
      const plan = PLANS[c.plan] ? c.plan : "basic";
      return {
        ...c.toObject(),
        plan,
        admin: adminByCenter[c._id] || null,
        studentCount: countByCenter[c._id] || 0,
        studentLimit: PLANS[plan].maxStudents,
      };
    }),
  });
});

// PATCH /api/superadmin/centers/:id   { status?, plan?, subscriptionEndsAt?, notes? }
export const updateCenter = asyncHandler(async (req, res) => {
  const center = await Center.findById(req.params.id);
  if (!center) throw new ApiError(404, "Center not found");

  const { status, plan, subscriptionEndsAt, notes } = req.body;

  if (status !== undefined) {
    if (!["pending", "active", "suspended"].includes(status)) throw new ApiError(400, "Invalid status");
    center.status = status;
  }
  if (plan !== undefined) {
    if (!PLAN_KEYS.includes(plan)) throw new ApiError(400, `plan must be one of: ${PLAN_KEYS.join(", ")}`);
    center.plan = plan;
  }
  if (subscriptionEndsAt !== undefined) {
    if (subscriptionEndsAt === null) {
      center.subscriptionEndsAt = undefined;
    } else {
      const d = new Date(subscriptionEndsAt);
      if (isNaN(d)) throw new ApiError(400, "Invalid subscriptionEndsAt");
      center.subscriptionEndsAt = d;
    }
  }
  if (notes !== undefined) center.notes = notes;

  await center.save();
  res.json({ success: true, center });
});