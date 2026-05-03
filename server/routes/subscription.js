import express from "express";
import {
  createOrder,
  verifyPayment,
  getSubscription,
  getPlans,
} from "../controller/subscription.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/plans", getPlans);
router.get("/", auth, getSubscription);
router.post("/create-order", auth, createOrder);
router.post("/verify-payment", auth, verifyPayment);

export default router;

