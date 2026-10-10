import { ApiError } from "../utils/ApiError.js";

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You don't have permission to do this"));
    }
    next();
  };