import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },
  friends: { type: [String], default: [] },
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  preferredLanguage: { type: String, default: "en", enum: ["en", "es", "hi", "pt", "zh", "fr"] },
  subscription: {
    plan: { type: String, enum: ["free", "bronze", "silver", "gold"], default: "free" },
    startDate: { type: Date },
    endDate: { type: Date },
    razorpaySubscriptionId: { type: String },
    razorpayPaymentId: { type: String },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  },
});
export default mongoose.model("user", userschema);
