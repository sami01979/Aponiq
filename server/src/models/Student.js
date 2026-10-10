import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    studentId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: { type: Date },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ center: 1, studentId: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);