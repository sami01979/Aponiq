import Center from "../models/Center.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken, setAuthCookie } from "../utils/generateToken.js";
import { assertCenterAccess } from "../utils/centerAccess.js";

const publicUser = (u) => ({
  id: u._id,
  center: u.center,
  name: u.name,
  phone: u.phone,
  email: u.email,
  role: u.role,
});

// /api/auth/register-center
// POST /api/auth/register-center
export const registerCenter = asyncHandler(async (req, res) => {
  const { centerName, name, phone, password } = req.body;

  if (!centerName || !name || !phone || !password) {
    throw new ApiError(400, "centerName, name, phone and password are required");
  }
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters");
  if (await User.findOne({ phone })) throw new ApiError(409, "Phone already registered");

  const center = await Center.create({ name: centerName, phone }); // status: pending
  await User.create({ center: center._id, name, phone, password, role: "admin" });

  res.status(201).json({
    success: true,
    message: "Registration received. Your center will be activated after approval.",
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) throw new ApiError(400, "Phone and password are required");

  const user = await User.findOne({ phone }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Wrong phone or password");
  }
  if (!user.isActive) throw new ApiError(403, "Account is disabled");
  await assertCenterAccess(user);

  setAuthCookie(res, signToken(user._id));
  res.json({ success: true, user: publicUser(user) });
});

///api/auth/logout
export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
};

// /api/auth/me
export const me = (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
};