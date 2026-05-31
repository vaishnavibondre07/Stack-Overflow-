import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Check, Crown, Star, Zap, Clock, Shield, Sparkles } from "lucide-react";
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

const PLAN_META: Record<
  string,
  {
    icon: React.ReactNode;
    gradient: string;
    accent: string;
    badge: string;
    ring: string;
    btnFrom: string;
    btnTo: string;
    shine: string;
    tag?: string;
  }
> = {
  free: {
    icon: <Star className="w-5 h-5" />,
    gradient: "from-slate-50 to-slate-100/60",
    accent: "text-slate-500",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    ring: "ring-slate-200",
    btnFrom: "from-slate-500",
    btnTo: "to-slate-600",
    shine: "bg-slate-400",
  },
  bronze: {
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-amber-50 to-orange-50/60",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    ring: "ring-amber-300",
    btnFrom: "from-amber-500",
    btnTo: "to-orange-500",
    shine: "bg-amber-400",
  },
  silver: {
    icon: <Shield className="w-5 h-5" />,
    gradient: "from-slate-50 to-blue-50/50",
    accent: "text-slate-600",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    ring: "ring-slate-300",
    btnFrom: "from-slate-500",
    btnTo: "to-blue-500",
    shine: "bg-slate-400",
    tag: "Popular",
  },
  gold: {
    icon: <Crown className="w-5 h-5" />,
    gradient: "from-yellow-50 to-amber-50/60",
    accent: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    ring: "ring-yellow-400",
    btnFrom: "from-yellow-500",
    btnTo: "to-amber-500",
    shine: "bg-yellow-400",
    tag: "Best Value",
  },
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "1 question per day",
    "Browse all questions & answers",
    "Vote on questions & answers",
    "Basic community access",
  ],
  bronze: [
    "5 questions per day",
    "All Free plan features",
    "Priority question visibility",
    "Extended question history",
  ],
  silver: [
    "10 questions per day",
    "All Bronze plan features",
    "Advanced search filters",
    "Custom profile badge",
  ],
  gold: [
    "Unlimited questions",
    "All Silver plan features",
    "Priority support",
    "Exclusive Gold badge",
  ],
};

const FAQ = [
  {
    q: "When can I make payments?",
    a: "Payments are accepted daily between 10:00 AM and 11:00 AM IST. You can browse plans anytime.",
  },
  {
    q: "How long does a subscription last?",
    a: "All paid subscriptions are valid for 1 month from the date of purchase and auto-revert to Free plan upon expiry.",
  },
  {
    q: "Can I upgrade mid-subscription?",
    a: "Yes, you can upgrade to a higher plan at any time. Your new plan starts immediately with a fresh 1-month period.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support UPI, credit/debit cards, net banking, and wallets through Razorpay's secure payment gateway.",
  },
];

const SubscriptionPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    fetchPlans();
    fetchSubscription();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get("/subscription/plans");
      setPlans(res.data.plans);
    } catch (e) { console.error(e); }
  };

  const fetchSubscription = async () => {
    try {
      const res = await axiosInstance.get("/subscription");
      setSubscription(res.data.subscription);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const checkPaymentTime = () => {
    const now = new Date();
    const t = now.getUTCHours() * 60 + now.getUTCMinutes();
    return t >= 4 * 60 + 30 && t < 5 * 60 + 30;
  };

  const handlePayment = async (plan: string) => {
    if (!window.Razorpay) { toast.error("Payment gateway not loaded. Please refresh."); return; }
    setProcessing(plan);
    try {
      const { data } = await axiosInstance.post("/subscription/create-order", { plan });
      const { orderId, amount, currency, key, subscriptionId } = data;

      const options = {
        key, amount, currency,
        name: "Stack Overflow Clone",
        description: `${plan} plan subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await axiosInstance.post("/subscription/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              subscriptionId,
            });
            toast.success("Payment successful! Subscription activated.");
            await fetchSubscription();
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          } finally { setProcessing(null); }
        },
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#f48024" },
        modal: { ondismiss: () => setProcessing(null) },
      };

      new window.Razorpay(options).open();
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.warning(err.response.data.message || "Payments only allowed 10:00–11:00 AM IST");
      } else {
        toast.error(err.response?.data?.message || "Failed to initiate payment");
      }
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
        </div>
      </Mainlayout>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const isPaymentTime = checkPaymentTime();

  return (
    <Mainlayout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">

          {/* Hero Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Membership Plans
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-none mb-4">
              Level up your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-orange-500">experience</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 4 Q25 0 50 4 Q75 8 100 4 Q125 0 150 4 Q175 8 200 4"
                    fill="none"
                    stroke="#fdba74"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Unlock more questions per day and premium community features. Cancel anytime.
            </p>

            {subscription && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full border ${PLAN_META[currentPlan]?.badge ?? ""}`}
                >
                  {PLAN_META[currentPlan]?.icon}
                  Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </span>
                {subscription.endDate && (
                  <span className="text-sm text-gray-400">
                    Renews {new Date(subscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Payment Time Banner */}
          {!isPaymentTime && (
            <div className="mb-10 flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 md:px-6 md:py-5 max-w-3xl mx-auto shadow-sm">
              <div className="flex-shrink-0 w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-amber-900 font-bold text-sm md:text-base">
                  Payments open: 10:00 AM – 11:00 AM IST
                </p>
                <p className="text-amber-700 text-xs md:text-sm mt-0.5 leading-relaxed">
                  Our payment window is once a day. Come back during this hour to complete your purchase.
                </p>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-16">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.plan] ?? PLAN_META.free;
              const features = PLAN_FEATURES[plan.plan] ?? [];
              const isCurrentPlan = currentPlan === plan.plan;
              const isFree = plan.plan === "free";
              const canSubscribe = !isFree && isPaymentTime && !isCurrentPlan;

              return (
                <div
                  key={plan.plan}
                  className={`
                    relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300
                    ${isCurrentPlan
                      ? `ring-2 ${meta.ring} border-transparent shadow-lg shadow-orange-100/50`
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
                    }
                    bg-gradient-to-b ${meta.gradient}
                  `}
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full bg-gradient-to-r ${meta.btnFrom} ${meta.btnTo}`} />

                  {/* Tag ribbon */}
                  {(meta.tag || isCurrentPlan) && (
                    <div className="absolute top-4 right-4">
                      <span
                        className={`
                          text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full
                          ${isCurrentPlan
                            ? "bg-blue-500 text-white"
                            : "bg-gradient-to-r from-orange-400 to-rose-400 text-white"
                          }
                        `}
                      >
                        {isCurrentPlan ? "Active" : meta.tag}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-5 lg:p-6">
                    {/* Icon + name */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm ${meta.accent}`}>
                        {meta.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Plan</p>
                        <h3 className="text-base font-bold text-gray-900 capitalize leading-tight">{plan.plan}</h3>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-1 flex items-end gap-1">
                      <span className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-none">
                        {isFree ? "₹0" : `₹${plan.price}`}
                      </span>
                      <span className="text-sm text-gray-400 mb-1">/mo</span>
                    </div>
                    <p className={`text-xs font-medium mb-5 ${meta.accent}`}>
                      {plan.questionsPerDay === Infinity
                        ? "Unlimited questions/day"
                        : `${plan.questionsPerDay} question${Number(plan.questionsPerDay) !== 1 ? "s" : ""}/day`}
                    </p>

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-200 mb-5" />

                    {/* Features */}
                    <ul className="space-y-3 flex-1 mb-6">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-green-600 stroke-[3]" />
                          </span>
                          <span className="text-sm text-gray-600 leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      disabled={isCurrentPlan || isFree || !canSubscribe}
                      onClick={() => handlePayment(plan.plan)}
                      className={`
                        w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                        ${isCurrentPlan
                          ? "bg-blue-500 text-white cursor-default"
                          : isFree
                          ? "bg-gray-100 text-gray-400 cursor-default"
                          : !isPaymentTime
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : `bg-gradient-to-r ${meta.btnFrom} ${meta.btnTo} text-white hover:opacity-90 hover:shadow-md active:scale-[0.98]`
                        }
                      `}
                    >
                      {processing === plan.plan ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing…
                        </span>
                      ) : isCurrentPlan ? "Current Plan"
                        : isFree ? "Free Forever"
                        : !isPaymentTime ? "Opens 10–11 AM IST"
                        : `Subscribe · ₹${plan.price}`
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table — md and above */}
          <div className="hidden md:block mb-16 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Compare all plans</h2>
              <p className="text-sm text-gray-500 mt-0.5">See exactly what's included at each tier</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-6 font-semibold text-gray-700 w-64">Feature</th>
                    {["free", "bronze", "silver", "gold"].map((p) => (
                      <th key={p} className="text-center py-3 px-4 font-semibold text-gray-700 capitalize">
                        <span className={`inline-flex items-center gap-1.5 ${PLAN_META[p]?.accent}`}>
                          {PLAN_META[p]?.icon}
                          {p}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: "Questions per day", vals: ["1", "5", "10", "∞"] },
                    { label: "Browse questions & answers", vals: [true, true, true, true] },
                    { label: "Vote on content", vals: [true, true, true, true] },
                    { label: "Priority visibility", vals: [false, true, true, true] },
                    { label: "Advanced search filters", vals: [false, false, true, true] },
                    { label: "Custom profile badge", vals: [false, false, true, true] },
                    { label: "Priority support", vals: [false, false, false, true] },
                    { label: "Exclusive Gold badge", vals: [false, false, false, true] },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-6 text-gray-700 font-medium">{row.label}</td>
                      {row.vals.map((v, j) => (
                        <td key={j} className="py-3 px-4 text-center">
                          {typeof v === "boolean" ? (
                            v ? (
                              <span className="inline-flex justify-center">
                                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-300 font-bold">—</span>
                            )
                          ) : (
                            <span className="font-semibold text-gray-800">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Common questions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center mt-0.5">
                      <span className="text-orange-500 font-bold text-xs">?</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1.5">{item.q}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Secured by Razorpay
              </span>
              <span className="hidden sm:block w-px h-4 bg-gray-200" />
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-500" />
                Cancel anytime
              </span>
              <span className="hidden sm:block w-px h-4 bg-gray-200" />
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Instant activation
              </span>
            </div>
          </div>

        </div>
      </div>
    </Mainlayout>
  );
};

export default SubscriptionPage;


// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import Mainlayout from "@/layout/Mainlayout";
// import { useAuth } from "@/lib/AuthContext";
// import axiosInstance from "@/lib/axiosinstance";
// import { Check, Crown, Star, Zap, Clock, Shield } from "lucide-react";
// import { useRouter } from "next/router";
// import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import Script from "next/script";

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// interface Plan {
//   plan: string;
//   price: number;
//   questionsPerDay: number | string;
// }

// interface Subscription {
//   plan: string;
//   startDate?: Date;
//   endDate?: Date;
//   status: string;
// }

// const SubscriptionPage = () => {
//   const router = useRouter();
//   const { user } = useAuth();
//   const [plans, setPlans] = useState<Plan[]>([]);
//   const [subscription, setSubscription] = useState<Subscription | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState<string | null>(null);

//   useEffect(() => {
//     if (!user) {
//       router.push("/auth");
//       return;
//     }
//     fetchPlans();
//     fetchSubscription();
//   }, [user]);

//   const fetchPlans = async () => {
//     try {
//       const res = await axiosInstance.get("/subscription/plans");
//       setPlans(res.data.plans);
//     } catch (error) {
//       console.error("Error fetching plans:", error);
//     }
//   };

//   const fetchSubscription = async () => {
//     try {
//       const res = await axiosInstance.get("/subscription");
//       setSubscription(res.data.subscription);
//     } catch (error) {
//       console.error("Error fetching subscription:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getPlanIcon = (plan: string) => {
//     switch (plan) {
//       case "free":
//         return <Star className="w-6 h-6 sm:w-7 sm:h-7" />;
//       case "bronze":
//         return <Zap className="w-6 h-6 sm:w-7 sm:h-7" />;
//       case "silver":
//         return <Shield className="w-6 h-6 sm:w-7 sm:h-7" />;
//       case "gold":
//         return <Crown className="w-6 h-6 sm:w-7 sm:h-7" />;
//       default:
//         return <Star className="w-6 h-6 sm:w-7 sm:h-7" />;
//     }
//   };

//   const getPlanStyles = (plan: string) => {
//     switch (plan) {
//       case "free":
//         return {
//           border: "border-gray-200",
//           iconBg: "bg-gray-100 text-gray-600",
//           badge: "bg-gray-100 text-gray-700",
//           button: "bg-gray-600 hover:bg-gray-700",
//         };
//       case "bronze":
//         return {
//           border: "border-amber-300",
//           iconBg: "bg-amber-50 text-amber-600",
//           badge: "bg-amber-100 text-amber-800",
//           button: "bg-amber-600 hover:bg-amber-700",
//         };
//       case "silver":
//         return {
//           border: "border-slate-300",
//           iconBg: "bg-slate-100 text-slate-600",
//           badge: "bg-slate-100 text-slate-800",
//           button: "bg-slate-600 hover:bg-slate-700",
//         };
//       case "gold":
//         return {
//           border: "border-yellow-400",
//           iconBg: "bg-yellow-50 text-yellow-600",
//           badge: "bg-yellow-100 text-yellow-800",
//           button: "bg-yellow-600 hover:bg-yellow-700",
//         };
//       default:
//         return {
//           border: "border-gray-200",
//           iconBg: "bg-gray-100 text-gray-600",
//           badge: "bg-gray-100 text-gray-700",
//           button: "bg-gray-600 hover:bg-gray-700",
//         };
//     }
//   };

//   const getPlanFeatures = (plan: string) => {
//     switch (plan) {
//       case "free":
//         return [
//           "1 question per day",
//           "Browse all questions & answers",
//           "Vote on questions & answers",
//           "Basic community access",
//         ];
//       case "bronze":
//         return [
//           "5 questions per day",
//           "All Free plan features",
//           "Priority question visibility",
//           "Extended question history",
//         ];
//       case "silver":
//         return [
//           "10 questions per day",
//           "All Bronze plan features",
//           "Advanced search filters",
//           "Custom profile badge",
//         ];
//       case "gold":
//         return [
//           "Unlimited questions",
//           "All Silver plan features",
//           "Priority support",
//           "Exclusive Gold badge",
//         ];
//       default:
//         return [];
//     }
//   };

//   const handlePayment = async (plan: string) => {
//     if (!window.Razorpay) {
//       toast.error("Payment gateway not loaded. Please refresh the page.");
//       return;
//     }

//     setProcessing(plan);
//     try {
//       const orderRes = await axiosInstance.post("/subscription/create-order", {
//         plan: plan,
//       });

//       const { orderId, amount, currency, key, subscriptionId } = orderRes.data;

//       const options = {
//         key: key,
//         amount: amount,
//         currency: currency,
//         name: "Stack Overflow Clone",
//         description: `Subscription for ${plan} plan`,
//         order_id: orderId,
//         handler: async function (response: any) {
//           try {
//             await axiosInstance.post("/subscription/verify-payment", {
//               razorpayOrderId: response.razorpay_order_id,
//               razorpayPaymentId: response.razorpay_payment_id,
//               razorpaySignature: response.razorpay_signature,
//               subscriptionId: subscriptionId,
//             });

//             toast.success("Payment successful! Subscription activated.");
//             await fetchSubscription();
//             setProcessing(null);
//           } catch (error: any) {
//             toast.error(
//               error.response?.data?.message || "Payment verification failed"
//             );
//             setProcessing(null);
//           }
//         },
//         prefill: {
//           name: user?.name || "",
//           email: user?.email || "",
//         },
//         theme: {
//           color: "#f48024",
//         },
//         modal: {
//           ondismiss: function () {
//             setProcessing(null);
//           },
//         },
//       };

//       const razorpay = new window.Razorpay(options);
//       razorpay.open();
//     } catch (error: any) {
//       if (error.response?.status === 403) {
//         toast.warning(
//           error.response.data.message ||
//             "Payments are only allowed between 10:00 AM - 11:00 AM IST"
//         );
//       } else {
//         toast.error(
//           error.response?.data?.message || "Failed to initiate payment"
//         );
//       }
//       setProcessing(null);
//     }
//   };

//   const checkPaymentTime = () => {
//     const now = new Date();
//     const utcHours = now.getUTCHours();
//     const utcMinutes = now.getUTCMinutes();
//     const utcTimeInMinutes = utcHours * 60 + utcMinutes;
//     const ist10AMInUTC = 4 * 60 + 30;
//     const ist11AMInUTC = 5 * 60 + 30;
//     return utcTimeInMinutes >= ist10AMInUTC && utcTimeInMinutes < ist11AMInUTC;
//   };

//   if (loading) {
//     return (
//       <Mainlayout>
//         <div className="flex justify-center items-center min-h-[60vh]">
//           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
//         </div>
//       </Mainlayout>
//     );
//   }

//   const currentPlan = subscription?.plan || "free";
//   const isPaymentTime = checkPaymentTime();

//   return (
//     <Mainlayout>
//       <Script
//         src="https://checkout.razorpay.com/v1/checkout.js"
//         strategy="lazyOnload"
//       />
//       <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
//         {/* Header Section */}
//         <div className="text-center mb-6 sm:mb-8 lg:mb-10">
//           <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
//             Choose Your Plan
//           </h1>
//           <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
//             Upgrade your experience with more questions per day and premium features.
//           </p>

//           {/* Current Plan Badge */}
//           {subscription && (
//             <div className="mt-4 sm:mt-5 inline-flex flex-col items-center gap-2">
//               <Badge className={`${getPlanStyles(currentPlan).badge} text-sm sm:text-base px-4 py-1.5`}>
//                 Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
//               </Badge>
//               {subscription.endDate && (
//                 <p className="text-xs sm:text-sm text-gray-500">
//                   Expires: {new Date(subscription.endDate).toLocaleDateString()}
//                 </p>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Payment Time Notice */}
//         {!isPaymentTime && (
//           <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-xl">
//             <div className="flex items-start gap-3">
//               <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
//               <div>
//                 <p className="text-amber-800 font-semibold text-sm sm:text-base">
//                   Payment Window: 10:00 AM - 11:00 AM IST
//                 </p>
//                 <p className="text-amber-700 text-xs sm:text-sm mt-1 leading-relaxed">
//                   Payments are only accepted during this daily time window. Please return during this period to complete your purchase.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Plans Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">
//           {plans.map((plan) => {
//             const isCurrentPlan = currentPlan === plan.plan;
//             const isFree = plan.plan === "free";
//             const canUpgrade = !isFree && isPaymentTime;
//             const styles = getPlanStyles(plan.plan);
//             const features = getPlanFeatures(plan.plan);

//             return (
//               <Card
//                 key={plan.plan}
//                 className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
//                   isCurrentPlan
//                     ? "ring-2 ring-blue-500 shadow-md"
//                     : `border-2 ${styles.border}`
//                 } ${plan.plan === "gold" ? "sm:col-span-2 lg:col-span-1" : ""}`}
//               >
//                 {/* Active Badge */}
//                 {isCurrentPlan && (
//                   <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
//                     Active
//                   </div>
//                 )}

//                 <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
//                   {/* Plan Icon & Name */}
//                   <div className="flex items-center gap-3 mb-3">
//                     <div className={`p-2 sm:p-2.5 rounded-lg ${styles.iconBg}`}>
//                       {getPlanIcon(plan.plan)}
//                     </div>
//                     <div>
//                       <CardTitle className="text-base sm:text-lg font-bold capitalize">
//                         {plan.plan}
//                       </CardTitle>
//                       <p className="text-xs text-gray-500">Plan</p>
//                     </div>
//                   </div>

//                   {/* Price */}
//                   <div className="mb-1">
//                     <span className="text-3xl sm:text-4xl font-bold text-gray-900">
//                       {isFree ? "Free" : `₹${plan.price}`}
//                     </span>
//                     {!isFree && (
//                       <span className="text-sm text-gray-500 ml-1">/month</span>
//                     )}
//                   </div>

//                   {/* Questions Per Day */}
//                   <p className="text-xs sm:text-sm text-gray-600">
//                     {plan.questionsPerDay === Infinity
//                       ? "Unlimited questions per day"
//                       : `${plan.questionsPerDay} question${Number(plan.questionsPerDay) !== 1 ? "s" : ""} per day`}
//                   </p>
//                 </CardHeader>

//                 <CardContent className="p-4 sm:p-5 pt-2 sm:pt-3">
//                   {/* Features List */}
//                   <ul className="space-y-2.5 mb-5">
//                     {features.map((feature, idx) => (
//                       <li key={idx} className="flex items-start gap-2">
//                         <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
//                         <span className="text-xs sm:text-sm text-gray-700 leading-snug">
//                           {feature}
//                         </span>
//                       </li>
//                     ))}
//                   </ul>

//                   {/* Action Button */}
//                   <Button
//                     className={`w-full text-sm font-semibold ${
//                       isCurrentPlan
//                         ? "bg-gray-100 text-gray-600 hover:bg-gray-100 cursor-default"
//                         : isFree
//                         ? "bg-gray-100 text-gray-600 hover:bg-gray-100 cursor-default"
//                         : !isPaymentTime
//                         ? "bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed"
//                         : `${styles.button} text-white`
//                     }`}
//                     disabled={isCurrentPlan || isFree || (!canUpgrade && !isFree)}
//                     onClick={() => handlePayment(plan.plan)}
//                   >
//                     {processing === plan.plan
//                       ? "Processing..."
//                       : isCurrentPlan
//                       ? "Current Plan"
//                       : isFree
//                       ? "Default Plan"
//                       : !isPaymentTime
//                       ? "Available 10-11 AM IST"
//                       : `Subscribe - ₹${plan.price}`}
//                   </Button>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>

//         {/* FAQ / Info Section */}
//         <div className="bg-gray-50 rounded-xl p-5 sm:p-6 lg:p-8">
//           <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
//             Frequently Asked Questions
//           </h2>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
//             <div>
//               <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
//                 When can I make payments?
//               </h3>
//               <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
//                 Payments are accepted daily between 10:00 AM and 11:00 AM IST. You can browse plans anytime.
//               </p>
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
//                 How long does a subscription last?
//               </h3>
//               <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
//                 All paid subscriptions are valid for 1 month from the date of purchase and auto-revert to Free plan upon expiry.
//               </p>
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
//                 Can I upgrade mid-subscription?
//               </h3>
//               <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
//                 Yes, you can upgrade to a higher plan at any time. Your new plan starts immediately with a fresh 1-month period.
//               </p>
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-800 mb-1.5 text-sm sm:text-base">
//                 What payment methods are supported?
//               </h3>
//               <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
//                 We support UPI, credit/debit cards, net banking, and wallets through Razorpay's secure payment gateway.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Mainlayout>
//   );
// };

// export default SubscriptionPage;
