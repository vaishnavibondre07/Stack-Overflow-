import Razorpay from "razorpay";
import crypto from "crypto";
import user from "../models/auth.js";
import Subscription from "../models/subscription.js";
import { sendInvoiceEmail } from "../utils/emailService.js";

// Initialize Razorpay lazily
let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.");
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// Plan configurations
const PLAN_CONFIG = {
  free: { price: 0, questionsPerDay: 1 },
  bronze: { price: 100, questionsPerDay: 5 },
  silver: { price: 300, questionsPerDay: 10 },
  gold: { price: 1000, questionsPerDay: Infinity },
};

// Check if current time is between 10 AM and 11 AM IST
const isPaymentTimeAllowed = () => {
  const now = new Date();
  // Get UTC time
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  
  // IST is UTC+5:30, so subtract 5:30 from IST to get UTC
  // 10:00 IST = 4:30 UTC, 11:00 IST = 5:30 UTC
  // So we need UTC time between 4:30 and 5:30
  const utcTimeInMinutes = utcHours * 60 + utcMinutes;
  const ist10AMInUTC = 4 * 60 + 30; // 4:30 UTC = 10:00 IST
  const ist11AMInUTC = 5 * 60 + 30; // 5:30 UTC = 11:00 IST
  
  return utcTimeInMinutes >= ist10AMInUTC && utcTimeInMinutes < ist11AMInUTC;
};

// Create payment order
export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const userid = req.userid;

    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!plan || !PLAN_CONFIG[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    if (plan === "free") {
      return res.status(400).json({ message: "Free plan is already active by default" });
    }

    // Check payment time restriction
    if (!isPaymentTimeAllowed()) {
      return res.status(403).json({ 
        message: "Payments are only allowed between 10:00 AM - 11:00 AM IST. Please try during this time window." 
      });
    }

    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const amount = PLAN_CONFIG[plan].price;
    const amountInPaise = amount * 100; // Razorpay expects amount in paise

    // Get Razorpay instance
    const razorpay = getRazorpayInstance();

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${userid}_${Date.now()}`,
      notes: {
        userId: userid,
        plan: plan,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save subscription record
    const subscription = await Subscription.create({
      userid: userid,
      plan: plan,
      amount: amount,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });

    res.status(200).json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription._id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Verify payment and update subscription
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, subscriptionId } = req.body;
    const userid = req.userid;

    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify payment signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update subscription status
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.userid !== userid) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.status = "completed";
    subscription.razorpayPaymentId = razorpayPaymentId;
    subscription.razorpaySignature = razorpaySignature;

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();

    // Update user subscription
    const userDoc = await user.findById(userid);
    userDoc.subscription = {
      plan: subscription.plan,
      startDate: startDate,
      endDate: endDate,
      razorpayPaymentId: razorpayPaymentId,
      status: "active",
    };
    await userDoc.save();

    // Send invoice email
    await sendInvoiceEmail(
      userDoc.email,
      userDoc.name,
      {
        plan: subscription.plan,
        amount: subscription.amount,
        paymentId: razorpayPaymentId,
        startDate: startDate,
        endDate: endDate,
      }
    );

    subscription.invoiceSent = true;
    await subscription.save();

    res.status(200).json({
      message: "Payment verified and subscription activated successfully",
      subscription: userDoc.subscription,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Get user subscription details
export const getSubscription = async (req, res) => {
  try {
    const userid = req.userid;

    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = userDoc.subscription || {
      plan: "free",
      status: "active",
    };

    // Check if subscription has expired
    if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
      subscription.status = "expired";
      subscription.plan = "free";
      userDoc.subscription = subscription;
      await userDoc.save();
    }

    const planConfig = PLAN_CONFIG[subscription.plan] || PLAN_CONFIG.free;

    res.status(200).json({
      subscription: subscription,
      planConfig: planConfig,
    });
  } catch (error) {
    console.error("Error getting subscription:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Get all plans
export const getPlans = async (req, res) => {
  try {
    const plans = Object.keys(PLAN_CONFIG).map((plan) => ({
      plan: plan,
      price: PLAN_CONFIG[plan].price,
      questionsPerDay: PLAN_CONFIG[plan].questionsPerDay,
    }));

    res.status(200).json({ plans });
  } catch (error) {
    console.error("Error getting plans:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

