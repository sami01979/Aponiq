import Attendance from "../models/Attendance.js";
import Batch from "../models/Batch.js";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["present", "absent", "late"];

// Batch in the user's center; teachers only get their own batches
const loadBatch = async (req, batchId) => {
  const batch = await Batch.findOne({ _id: batchId, center: req.user.center });
  if (!batch) throw new ApiError(404, "Batch not found");
  if (req.user.role === "teacher" && String(batch.teacher) !== String(req.user._id)) {
    throw new ApiError(403, "This is not your batch");
  }
  return batch;
};

// POST /api/attendance
// { batchId, date: "2026-10-10", records: [{ studentId, status }] }
export const markAttendance = asyncHandler(async (req, res) => {
  const { batchId, date, records } = req.body;

  if (!batchId || !date || !Array.isArray(records)) {
    throw new ApiError(400, "batchId, date and records are required");
  }
  if (!DATE_RX.test(date)) throw new ApiError(400, "date must be YYYY-MM-DD");

  const batch = await loadBatch(req, batchId);

  const enrolled = await Enrollment.find({ batch: batch._id, status: "active" }).select("student");
  const allowed = new Set(enrolled.map((e) => String(e.student)));

  const seen = new Set();
  for (const r of records) {
    if (!r.studentId || !STATUSES.includes(r.status)) {
      throw new ApiError(400, `Each record needs studentId and status (${STATUSES.join("/")})`);
    }
    if (!allowed.has(String(r.studentId))) {
      throw new ApiError(400, `Student ${r.studentId} is not enrolled in this batch`);
    }
    if (seen.has(String(r.studentId))) throw new ApiError(400, "Duplicate student in records");
    seen.add(String(r.studentId));
  }

  const attendance = await Attendance.findOneAndUpdate(
    { batch: batch._id, date },
    {
      center: req.user.center,
      batch: batch._id,
      date,
      records: records.map((r) => ({ student: r.studentId, status: r.status })),
      markedBy: req.user._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, attendance });
});

// GET /api/attendance?batchId=...&date=2026-10-10
// Returns the roster plus any saved attendance, so the UI can pre-fill
export const getBatchAttendance = asyncHandler(async (req, res) => {
  const { batchId, date } = req.query;
  if (!batchId || !date) throw new ApiError(400, "batchId and date are required");
  if (!DATE_RX.test(date)) throw new ApiError(400, "date must be YYYY-MM-DD");

  const batch = await loadBatch(req, batchId);

  const roster = await Enrollment.find({ batch: batch._id, status: "active" })
    .populate("student", "studentId name")
    .sort({ joinedAt: 1 });

  const attendance = await Attendance.findOne({ batch: batch._id, date });

  res.json({
    success: true,
    roster: roster.map((e) => e.student),
    attendance: attendance || null,
  });
});


export const studentAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.studentId, center: req.user.center });
  if (!student) throw new ApiError(404, "Student not found");

  if (req.user.role === "parent" && !student.parents.some((p) => String(p) === String(req.user._id))) {
    throw new ApiError(403, "This is not your child");
  }

  const { from, to } = req.query;
  const filter = { center: req.user.center, "records.student": student._id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }

  const docs = await Attendance.find(filter).populate("batch", "name subject").sort({ date: -1 });

  const entries = docs.map((d) => ({
    date: d.date,
    batch: d.batch,
    status: d.records.find((r) => String(r.student) === String(student._id)).status,
  }));

  const summary = { present: 0, absent: 0, late: 0, total: entries.length };
  entries.forEach((e) => summary[e.status]++);

  res.json({ success: true, summary, entries });
});