import rateLimit from "express-rate-limit";

const make = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message }),
    ...extra,
  });

// Only failed logins count, so normal users are never blocked
export const loginLimiter = make(
  15 * 60 * 1000,
  10,
  "Too many failed login attempts. Try again in 15 minutes",
  { skipSuccessfulRequests: true }
);

export const registerLimiter = make(
  60 * 60 * 1000,
  5,
  "Too many registrations from this connection. Try again later"
);

export const apiLimiter = make(60 * 1000, 300, "Too many requests. Please slow down");