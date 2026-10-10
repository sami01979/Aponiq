import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // "2026-10-10"
    records: [
      {
        _id: false,
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        status: { type: String, enum: ["present", "absent", "late"], required: true },
      },
    ],
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });
attendanceSchema.index({ "records.student": 1, date: -1 });

export default mongoose.model("Attendance", attendanceSchema);