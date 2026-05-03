import mongoose from "mongoose";

const passwordResetSchema = mongoose.Schema({
  userid: { type: String, required: true },
  resetToken: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

export default mongoose.model("passwordReset", passwordResetSchema);

