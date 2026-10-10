import Fee from "../models/Fee.js";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MONTH_RX = /^\d{4}-(0[1-9]|1[0-2])$/;
const METHODS = ["cash", "bkash", "nagad", "bank", "other"];

const statusFor = (fee) => (fee.paid >= fee.amount ? "paid" : fee.paid > 0 ? "partial" : "due");

// /api/fees/generate   
// Creates a due for every active enrollment. 
export const generateFees = asyncHandler(async (req, res) => {
  const { month } = req.body;
  if (!month || !MONTH_RX.test(month)) throw new ApiError(400, "month must be YYYY-MM");

  const enrollments = await Enrollment.find({ center: req.user.center, status: "active" });

  if (enrollments.length === 0) {
    return res.json({ success: true, created: 0, skipped: 0, message: "No active enrollments" });
  }

  const result = await Fee.bulkWrite(
    enrollments.map((e) => ({
      updateOne: {
        filter: { enrollment: e._id, month },
        update: {
          $setOnInsert: {
            center: req.user.center,
            student: e.student,
            batch: e.batch,
            enrollment: e._id,
            month,
            amount: e.monthlyFee,
            paid: 0,
            status: "due",
          },
        },
        upsert: true,
      },
    }))
  );

  const created = result.upsertedCount;
  res.status(201).json({ success: true, created, skipped: enrollments.length - created });
});

//  /api/fees?month=2026-10&status=due&batchId=...
export const listFees = asyncHandler(async (req, res) => {
  const { month, status, batchId } = req.query;
  const filter = { center: req.user.center };

  if (month) {
    if (!MONTH_RX.test(month)) throw new ApiError(400, "month must be YYYY-MM");
    filter.month = month;
  }
  if (status) {
    if (!["due", "partial", "paid"].includes(status)) throw new ApiError(400, "Invalid status");
    filter.status = status;
  }
  if (batchId) filter.batch = batchId;

  const fees = await Fee.find(filter)
    .populate("student", "studentId name phone")
    .populate("batch", "name")
    .sort({ month: -1, createdAt: -1 });

  const totals = fees.reduce(
    (t, f) => {
      t.billed += f.amount;
      t.collected += f.paid;
      return t;
    },
    { billed: 0, collected: 0 }
  );
  totals.outstanding = totals.billed - totals.collected;

  res.json({ success: true, count: fees.length, totals, fees });
});

//  /api/fees/:id/pay  
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method = "cash", note } = req.body;

  if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, "amount must be a positive number");
  if (!METHODS.includes(method)) throw new ApiError(400, `method must be one of: ${METHODS.join(", ")}`);

  const fee = await Fee.findOne({ _id: req.params.id, center: req.user.center });
  if (!fee) throw new ApiError(404, "Fee not found");

  const remaining = fee.amount - fee.paid;
  if (remaining <= 0) throw new ApiError(400, "This fee is already fully paid");
  if (amount > remaining) throw new ApiError(400, `Amount exceeds remaining due (${remaining})`);

  fee.payments.push({ amount, method, note, receivedBy: req.user._id });
  fee.paid += amount;
  fee.status = statusFor(fee);

  await fee.save();
  res.json({ success: true, fee });
});

//  /api/fees/student/:studentId
// Admin: any student in the center. Parent: only their own children.
export const studentFees = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.studentId, center: req.user.center });
  if (!student) throw new ApiError(404, "Student not found");

  if (req.user.role === "parent" && !student.parents.some((p) => String(p) === String(req.user._id))) {
    throw new ApiError(403, "This is not your child");
  }

  const fees = await Fee.find({ center: req.user.center, student: student._id })
    .populate("batch", "name subject")
    .sort({ month: -1 });

  const totalDue = fees.reduce((sum, f) => sum + (f.amount - f.paid), 0);

  res.json({ success: true, totalDue, count: fees.length, fees });
});