import mongoose from "mongoose";

const languageChangeSchema = mongoose.Schema({
  userid: { type: String, required: true },
  currentLanguage: { type: String, required: true },
  newLanguage: { type: String, required: true },
  verificationMethod: { type: String, enum: ["email", "phone"], required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
});

export default mongoose.model("languageChange", languageChangeSchema);

