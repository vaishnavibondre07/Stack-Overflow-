import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
  userid: { type: String, required: true },
  plan: { type: String, enum: ["free", "bronze", "silver", "gold"], required: true },
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  startDate: { type: Date },
  endDate: { type: Date },
  invoiceSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("subscription", subscriptionSchema);

