import Student from "../models/Student.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertCanAddStudent, getUsage } from "../utils/planLimits.js";

const validateParents = async (ids, center) => {
  if (!ids || ids.length === 0) return [];
  const found = await User.find({ _id: { $in: ids }, center, role: "parent" }).select("_id");
  if (found.length !== new Set(ids.map(String)).size) {
    throw new ApiError(400, "One or more parents are invalid");
  }
  return found.map((p) => p._id);
};

const nextStudentId = async (center) => {
  const count = await Student.countDocuments({ center });
  return `STU-${String(count + 1).padStart(4, "0")}`;
};

// /api/students
export const createStudent = asyncHandler(async (req, res) => {
  const { name, gender, dob, phone, address, parents } = req.body;
  if (!name) throw new ApiError(400, "name is required");
    await assertCanAddStudent(req.user.center);

  const center = req.user.center;
  const parentIds = await validateParents(parents, center);

  const student = await Student.create({
    center,
    studentId: await nextStudentId(center),
    name,
    gender,
    dob,
    phone,
    address,
    parents: parentIds,
  });

  res.status(201).json({ success: true, student });
});

//  /api/students
export const listStudents = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { center: req.user.center };

  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { studentId: rx }, { phone: rx }];
  }

  const students = await Student.find(filter)
    .populate("parents", "name phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: students.length, students });
});

// /api/students/my  parent page: only their own children
export const myChildren = asyncHandler(async (req, res) => {
  const students = await Student.find({
    center: req.user.center,
    parents: req.user._id,
    isActive: true,
  });
  res.json({ success: true, count: students.length, students });
});

// /api/students/:id
export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    center: req.user.center,
  }).populate("parents", "name phone");

  if (!student) throw new ApiError(404, "Student not found");
  res.json({ success: true, student });
});

// /api/students/:id   
export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, center: req.user.center });
  if (!student) throw new ApiError(404, "Student not found");
    if (req.body.isActive === true && !student.isActive) {
    await assertCanAddStudent(req.user.center);
  }

  const { name, gender, dob, phone, address, isActive, parents } = req.body;
  if (name !== undefined) student.name = name;
  if (gender !== undefined) student.gender = gender;
  if (dob !== undefined) student.dob = dob;
  if (phone !== undefined) student.phone = phone;
  if (address !== undefined) student.address = address;
  if (isActive !== undefined) student.isActive = isActive;
  if (parents !== undefined) student.parents = await validateParents(parents, req.user.center);

  await student.save();
  await student.populate("parents", "name phone");
  res.json({ success: true, student });
});
// GET /api/students/usage
export const studentUsage = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await getUsage(req.user.center)) });
});