import mongoose from "mongoose";
import { PLAN_KEYS } from "../config/plans.js";

const centerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    status: { type: String, enum: ["pending", "active", "suspended"], default: "pending" },
    subscriptionEndsAt: { type: Date },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    plan: { type: String, enum: PLAN_KEYS, default: "basic" },
  },
  { timestamps: true }
);

export default mongoose.model("Center", centerSchema);