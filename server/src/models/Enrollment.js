import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    monthlyFee: { type: Number, default: 0, min: 0 }, // copied from batch, can be discounted per student
    status: { type: String, enum: ["active", "left"], default: "active" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);