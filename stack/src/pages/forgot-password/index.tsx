import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Mail, AlertTriangle, KeyRound } from "lucide-react";

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/user/forgot-password", { email });
      
      if (res.data.resetToken && res.data.userId) {
        setIsSubmitted(true);
        toast.success("Password reset instructions sent!");
      } else {
        setIsSubmitted(true);
        toast.success(res.data.message || "Check your email for reset instructions");
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        // User has already requested password reset today
        toast.warning("You have already requested a password reset today. Please try again tomorrow.", {
          icon: <AlertTriangle className="text-amber-500" />,
        });
      } else if (error.response?.status === 404) {
        toast.error("No account found with this email");
      } else {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 lg:mb-8">
            <Link href="/" className="flex items-center justify-center mb-4">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
                </div>
              </div>
              <span className="text-lg lg:text-xl font-bold text-gray-800">
                stack<span className="font-normal">overflow</span>
              </span>
            </Link>
          </div>
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-sm text-gray-600 mb-6">
                If an account exists with <span className="font-medium">{email}</span>, 
                we've sent password reset instructions to that email address.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm text-amber-800 font-medium">Important:</p>
                    <p className="text-xs text-amber-700 mt-1">
                      You can only request password reset once per day. Check your email before requesting again tomorrow.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Didn't receive the email? Check your spam folder or try again tomorrow.
              </p>
              <Button
                onClick={() => router.push("/auth")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-800">
              stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="space-y-1 text-center p-4 sm:p-6 pb-2">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl lg:text-2xl">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Enter your email address and we'll send you instructions to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2"
                disabled={loading || !email}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Sending...
                  </span>
                ) : (
                  "Send Reset Instructions"
                )}
              </Button>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> You can only request password reset once per day. 
                    Make sure you have access to your email before requesting.
                  </p>
                </div>
              </div>

              <div className="text-center text-sm pt-2">
                Remember your password?{" "}
                <Link href="/auth" className="text-blue-600 hover:underline font-medium">
                  Log in
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
