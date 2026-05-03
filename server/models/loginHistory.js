import mongoose from "mongoose";

const loginHistorySchema = mongoose.Schema({
  userid: { type: String, required: true },
  email: { type: String, required: true },
  browser: { type: String },
  os: { type: String },
  deviceType: { type: String, enum: ["desktop", "laptop", "mobile", "tablet", "unknown"] },
  ipAddress: { type: String },
  userAgent: { type: String },
  loginTime: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failed", "pending"], default: "success" },
  requiresOTP: { type: Boolean, default: false },
  otpVerified: { type: Boolean, default: false },
});

export default mongoose.model("loginHistory", loginHistorySchema);

