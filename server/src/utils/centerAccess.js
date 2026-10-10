import Center from "../models/Center.js";
import { ApiError } from "./ApiError.js";

export const assertCenterAccess = async (user) => {
  if (user.role === "superadmin") return;

  const center = await Center.findById(user.center);
  if (!center) throw new ApiError(403, "Center not found");
  if (center.status === "pending") throw new ApiError(403, "Your center is awaiting approval");
  if (center.status === "suspended") throw new ApiError(403, "Your center is suspended. Please contact support");
  if (center.subscriptionEndsAt && center.subscriptionEndsAt < new Date()) {
    throw new ApiError(403, "Subscription expired. Please renew to continue");
  }
};