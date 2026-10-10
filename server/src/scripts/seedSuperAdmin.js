import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../models/User.js";
import Center from "../models/Center.js";

const phone = process.env.SUPERADMIN_PHONE;
const password = process.env.SUPERADMIN_PASSWORD;
const name = process.env.SUPERADMIN_NAME || "Super Admin";

if (!phone || !password) {
  console.error("Set SUPERADMIN_PHONE and SUPERADMIN_PASSWORD in .env");
  process.exit(1);
}

await mongoose.connect(env.mongoUri);

// Centers created before this update have no status: activate them so they keep working
const migrated = await Center.collection.updateMany({ status: { $exists: false } }, { $set: { status: "active" } });
console.log(`Activated ${migrated.modifiedCount} existing center(s)`);

const existing = await User.findOne({ phone });
if (existing) {
  console.log("A user with this phone already exists. Pick a different SUPERADMIN_PHONE.");
} else {
  await User.create({ name, phone, password, role: "superadmin" });
  console.log("Super admin created");
}

await mongoose.disconnect();