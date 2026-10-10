import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;
  const header = req.headers.authorization;
  if (!token && header?.startsWith("Bearer ")) token = header.split(" ")[1];

  if (!token) throw new ApiError(401, "Not logged in");

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(401, "Account not available");

  req.user = user;
  next();
});