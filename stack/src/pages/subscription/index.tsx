import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Check, Crown, Star, Zap, Clock, Shield } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  plan: string;
  price: number;
  questionsPerDay: number | string;
}

interface Subscription {
  plan: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
}

const SubscriptionPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchPlans();
    fetchSubscription();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get("/subscription/plans");
      setPlans(res.data.plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await axiosInstance.get("/subscription");
      setSubscription(res.data.subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "free":
        return <Star className="w-6 h-6 sm:w-7 sm:h-7" />;
      case "bronze":
        return <Zap className="w-6 h-6 sm:w-7 sm:h-7" />;
      case "silver":
        return <Shield className="w-6 h-6 sm:w-7 sm:h-7" />;
      case "gold":
        return <Crown className="w-6 h-6 sm:w-7 sm:h-7" />;
      default:
        return <Star className="w-6 h-6 sm:w-7 sm:h-7" />;
    }
  };

  const getPlanStyles = (plan: string) => {
    switch (plan) {
      case "free":
        return {
          border: "border-gray-200",
          iconBg: "bg-gray-100 text-gray-600",
          badge: "bg-gray-100 text-gray-700",
          button: "bg-gray-600 hover:bg-gray-700",
        };
      case "bronze":
        return {
          border: "border-amber-300",
          iconBg: "bg-amber-50 text-amber-600",
          badge: "bg-amber-100 text-amber-800",
          button: "bg-amber-600 hover:bg-amber-700",
        };
      case "silver":
        return {
          border: "border-slate-300",
          iconBg: "bg-slate-100 text-slate-600",
          badge: "bg-slate-100 text-slate-800",
          button: "bg-slate-600 hover:bg-slate-700",
        };
      case "gold":
        return {
          border: "border-yellow-400",
          iconBg: "bg-yellow-50 text-yellow-600",
          badge: "bg-yellow-100 text-yellow-800",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      default:
        return {
          border: "border-gray-200",
          iconBg: "bg-gray-100 text-gray-600",
          badge: "bg-gray-100 text-gray-700",
          button: "bg-gray-600 hover:bg-gray-700",
        };
    }
  };

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case "free":
        return [
          "1 question per day",
          "Browse all questions & answers",
          "Vote on questions & answers",
          "Basic community access",
        ];
      case "bronze":
        return [
          "5 questions per day",
          "All Free plan features",
          "Priority question visibility",
          "Extended question history",
        ];
      case "silver":
        return [
          "10 questions per day",
          "All Bronze plan features",
          "Advanced search filters",
          "Custom profile badge",
        ];
      case "gold":
        return [
          "Unlimited questions",
          "All Silver plan features",
          "Priority support",
          "Exclusive Gold badge",
        ];
      default:
        return [];
    }
  };

  const handlePayment = async (plan: string) => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setProcessing(plan);
    try {
      const orderRes = await axiosInstance.post("/subscription/create-order", {
        plan: plan,
      });

      const { orderId, amount, currency, key, subscriptionId } = orderRes.data;

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: "Stack Overflow Clone",
        description: `Subscription for ${plan} plan`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await axiosInstance.post("/subscription/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              subscriptionId: subscriptionId,
            });

            toast.success("Payment successful! Subscription activated.");
            await fetchSubscription();
            setProcessing(null);
          } catch (error: any) {
            toast.error(
              error.response?.data?.message || "Payment verification failed"
            );
            setProcessing(null);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#f48024",
        },
        modal: {
          ondismiss: function () {
            setProcessing(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.warning(
          error.response.data.message ||
            "Payments are only allowed between 10:00 AM - 11:00 AM IST"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to initiate payment"
        );
      }
      setProcessing(null);
    }
  };

  const checkPaymentTime = () => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcTimeInMinutes = utcHours * 60 + utcMinutes;
    const ist10AMInUTC = 4 * 60 + 30;
    const ist11AMInUTC = 5 * 60 + 30;
    return utcTimeInMinutes >= ist10AMInUTC && utcTimeInMinutes < ist11AMInUTC;
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const isPaymentTime = checkPaymentTime();

  return (
    <Mainlayout>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Choose Your Plan
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upgrade your experience with more questions per day and premium features.
          </p>

          {/* Current Plan Badge */}
          {subscription && (
            <div className="mt-4 sm:mt-5 inline-flex flex-col items-center gap-2">
              <Badge className={`${getPlanStyles(currentPlan).badge} text-sm sm:text-base px-4 py-1.5`}>
                Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Badge>
              {subscription.endDate && (
                <p className="text-xs sm:text-sm text-gray-500">
                  Expires: {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment Time Notice */}
        {!isPaymentTime && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-semibold text-sm sm:text-base">
                  Payment Window: 10:00 AM - 11:00 AM IST
                </p>
                <p className="text-amber-700 text-xs sm:text-sm mt-1 leading-relaxed">
                  Payments are only accepted during this daily time window. Please return during this period to complete your purchase.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.plan;
            const isFree = plan.plan === "free";
            const canUpgrade = !isFree && isPaymentTime;
            const styles = getPlanStyles(plan.plan);
            const features = getPlanFeatures(plan.plan);

            return (
              <Card
                key={plan.plan}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  isCurrentPlan
                    ? "ring-2 ring-blue-500 shadow-md"
                    : `border-2 ${styles.border}`
                } ${plan.plan === "gold" ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                {/* Active Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Active
                  </div>
                )}

                <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 sm:p-2.5 rounded-lg ${styles.iconBg}`}>
                      {getPlanIcon(plan.plan)}
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold capitalize">
                        {plan.plan}
                      </CardTitle>
                      <p className="text-xs text-gray-500">Plan</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {isFree ? "Free" : `₹${plan.price}`}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-gray-500 ml-1">/month</span>
                    )}
                  </div>

                  {/* Questions Per Day */}
                  <p className="text-xs sm:text-sm text-gray-600">
                    {plan.questionsPerDay === Infinity
                      ? "Unlimited questions per day"
                      : `${plan.questionsPerDay} question${Number(plan.questionsPerDay) !== 1 ? "s" : ""} per day`}
                  </p>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-2 sm:pt-3">
                  {/* Features List */}
                  <ul className="space-y-2.5 mb-5">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-gray-700 leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Button
                    className={`w-full text-sm font-semibold ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-100 cursor-default"
                        : isFree
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-100 cursor-default"
                        : !isPaymentTime
                        ? "bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed"
                        : `${styles.button} text-white`
                    }`}
                    disabled={isCurrentPlan || isFree || (!canUpgrade && !isFree)}
                    onClick={() => handlePayment(plan.plan)}
                  >
                    {processing === plan.plan
                      ? "Processing..."
                      : isCurrentPlan
                      ? "Current Plan"
                      : isFree
                      ? "Default Plan"
                      : !isPaymentTime
                      ? "Available 10-11 AM IST"
                      : `Subscribe - ₹${plan.price}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Info Section */}
        <div className="bg-gray-50 rounded-xl p-5 sm:p-6 lg:p-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
                When can I make payments?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Payments are accepted daily between 10:00 AM and 11:00 AM IST. You can browse plans anytime.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
                How long does a subscription last?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                All paid subscriptions are valid for 1 month from the date of purchase and auto-revert to Free plan upon expiry.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
                Can I upgrade mid-subscription?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Yes, you can upgrade to a higher plan at any time. Your new plan starts immediately with a fresh 1-month period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
                What payment methods are supported?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                We support UPI, credit/debit cards, net banking, and wallets through Razorpay's secure payment gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Mainlayout>
  );
};

export default SubscriptionPage;
