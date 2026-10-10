import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const checkTeacher = async (teacherId, center) => {
  if (!teacherId) return;
  const t = await User.findOne({ _id: teacherId, center, role: "teacher" });
  if (!t) throw new ApiError(400, "Invalid teacher");
};

// Loads a batch in the user's center. Teachers can only access their own batches.
const loadBatch = async (req) => {
  const batch = await Batch.findOne({ _id: req.params.id, center: req.user.center });
  if (!batch) throw new ApiError(404, "Batch not found");
  if (req.user.role === "teacher" && String(batch.teacher) !== String(req.user._id)) {
    throw new ApiError(403, "This is not your batch");
  }
  return batch;
};

//  /api/batches
export const createBatch = asyncHandler(async (req, res) => {
  const { name, subject, teacher, days, startTime, endTime, monthlyFee } = req.body;
  if (!name) throw new ApiError(400, "name is required");
  await checkTeacher(teacher, req.user.center);

  const batch = await Batch.create({
    center: req.user.center,
    name,
    subject,
    teacher,
    days,
    startTime,
    endTime,
    monthlyFee,
  });
  res.status(201).json({ success: true, batch });
});

// /api/batches
export const listBatches = asyncHandler(async (req, res) => {
  const filter = { center: req.user.center };
  if (req.user.role === "teacher") filter.teacher = req.user._id;

  const batches = await Batch.find(filter).populate("teacher", "name phone").sort({ createdAt: -1 });
  res.json({ success: true, count: batches.length, batches });
});

// /api/batches/:id
export const getBatch = asyncHandler(async (req, res) => {
  const batch = await loadBatch(req);
  await batch.populate("teacher", "name phone");
  res.json({ success: true, batch });
});

// /api/batches/:id
export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({ _id: req.params.id, center: req.user.center });
  if (!batch) throw new ApiError(404, "Batch not found");

  const { name, subject, teacher, days, startTime, endTime, monthlyFee, isActive } = req.body;
  if (teacher !== undefined) await checkTeacher(teacher, req.user.center);

  if (name !== undefined) batch.name = name;
  if (subject !== undefined) batch.subject = subject;
  if (teacher !== undefined) batch.teacher = teacher;
  if (days !== undefined) batch.days = days;
  if (startTime !== undefined) batch.startTime = startTime;
  if (endTime !== undefined) batch.endTime = endTime;
  if (monthlyFee !== undefined) batch.monthlyFee = monthlyFee;
  if (isActive !== undefined) batch.isActive = isActive;

  await batch.save();
  res.json({ success: true, batch });
});

// /api/batches/:id/enroll  
export const enrollStudent = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({ _id: req.params.id, center: req.user.center });
  if (!batch) throw new ApiError(404, "Batch not found");

  const { studentId, monthlyFee } = req.body;
  if (!studentId) throw new ApiError(400, "studentId is required");

  const student = await Student.findOne({ _id: studentId, center: req.user.center });
  if (!student) throw new ApiError(404, "Student not found");

  let enrollment = await Enrollment.findOne({ student: student._id, batch: batch._id });

  if (enrollment) {
    if (enrollment.status === "active") throw new ApiError(409, "Student already in this batch");
    
    enrollment.status = "active";
    enrollment.joinedAt = new Date();
    if (monthlyFee !== undefined) enrollment.monthlyFee = monthlyFee;
    await enrollment.save();
  } else {
    enrollment = await Enrollment.create({
      center: req.user.center,
      student: student._id,
      batch: batch._id,
      monthlyFee: monthlyFee !== undefined ? monthlyFee : batch.monthlyFee,
    });
  }

  res.status(201).json({ success: true, enrollment });
});

// /api/batches/:id/students
export const batchStudents = asyncHandler(async (req, res) => {
  const batch = await loadBatch(req);

  const enrollments = await Enrollment.find({ batch: batch._id, status: "active" })
    .populate("student", "studentId name phone")
    .sort({ joinedAt: 1 });

  res.json({ success: true, count: enrollments.length, enrollments });
});

//  /api/batches/enrollments/:id   
export const updateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({ _id: req.params.id, center: req.user.center });
  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  const { status, monthlyFee } = req.body;
  if (status !== undefined) {
    if (!["active", "left"].includes(status)) throw new ApiError(400, "Invalid status");
    enrollment.status = status;
  }
  if (monthlyFee !== undefined) enrollment.monthlyFee = monthlyFee;

  await enrollment.save();
  res.json({ success: true, enrollment });
});