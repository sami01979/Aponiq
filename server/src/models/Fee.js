import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ }, // "2026-10"
    amount: { type: Number, required: true, min: 0 },
    paid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["due", "partial", "paid"], default: "due" },
    payments: [
      {
        amount: { type: Number, required: true, min: 1 },
        method: { type: String, enum: ["cash", "bkash", "nagad", "bank", "other"], default: "cash" },
        note: { type: String, trim: true },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        paidAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

feeSchema.index({ enrollment: 1, month: 1 }, { unique: true });
feeSchema.index({ student: 1, month: -1 });

export default mongoose.model("Fee", feeSchema);