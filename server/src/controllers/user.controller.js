import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MANAGEABLE = ["teacher", "parent"];

// /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role } = req.body;

  if (!name || !phone || !password || !role) {
    throw new ApiError(400, "name, phone, password and role are required");
  }
  if (!MANAGEABLE.includes(role)) {
    throw new ApiError(400, `role must be one of: ${MANAGEABLE.join(", ")}`);
  }
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters");
  if (await User.findOne({ phone })) throw new ApiError(409, "Phone already registered");

  const user = await User.create({
    center: req.user.center,
    name,
    phone,
    email,
    password,
    role,
  });

  res.status(201).json({ success: true, user });
});

// /api/users
export const listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = { center: req.user.center, role: { $in: MANAGEABLE } };

  if (role) {
    if (!MANAGEABLE.includes(role)) throw new ApiError(400, "Invalid role");
    filter.role = role;
  }
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { phone: rx }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    center: req.user.center,
    role: { $in: MANAGEABLE },
  }).select("+password");

  if (!user) throw new ApiError(404, "User not found");

  const { name, email, isActive, password } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) {
    if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters");
    user.password = password;
  }

  await user.save();
  user.password = undefined;
  res.json({ success: true, user });
});