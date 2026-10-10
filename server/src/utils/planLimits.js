import Center from "../models/Center.js";
import Student from "../models/Student.js";
import { PLANS } from "../config/plans.js";
import { ApiError } from "./ApiError.js";

export const getUsage = async (centerId) => {
  const center = await Center.findById(centerId);
  const plan = PLANS[center?.plan] ? center.plan : "basic";
  const limit = PLANS[plan].maxStudents;
  const count = await Student.countDocuments({ center: centerId, isActive: true });
  return { plan, limit, count };
};

export const assertCanAddStudent = async (centerId) => {
  const { plan, limit, count } = await getUsage(centerId);
  if (limit !== null && count >= limit) {
    throw new ApiError(
      403,
      `Your ${PLANS[plan].label} plan allows up to ${limit} students. Please upgrade your plan to add more.`
    );
  }
};