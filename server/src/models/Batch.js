import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    days: [{ type: String, enum: ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] }],
    startTime: { type: String }, 
    endTime: { type: String }, 
    monthlyFee: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);