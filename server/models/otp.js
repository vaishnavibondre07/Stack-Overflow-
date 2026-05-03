import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  userid: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  loginHistoryId: { type: String },
  languageChangeId: { type: String }, // For language change OTP
  type: { type: String, enum: ["login", "password-reset", "language-change"], default: "login" },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete expired OTPs after 10 minutes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

export default mongoose.model("otp", otpSchema);

