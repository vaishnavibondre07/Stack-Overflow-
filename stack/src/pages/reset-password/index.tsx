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
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { RefreshCw, Copy, Check, Key, Eye, EyeOff, ShieldCheck } from "lucide-react";

const ResetPassword = () => {
  const router = useRouter();
  const { token, userId } = router.query;
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLength, setPasswordLength] = useState(12);
  const [isValidLink, setIsValidLink] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!token || !userId) {
      setIsValidLink(false);
      toast.error("Invalid reset link");
      setTimeout(() => router.push("/forgot-password"), 2000);
    }
  }, [token, userId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const generatePassword = async () => {
    try {
      const res = await axiosInstance.post("/user/generate-password", {
        length: passwordLength,
      });
      setGeneratedPassword(res.data.password);
      setForm({
        password: res.data.password,
        confirmPassword: res.data.password,
      });
      toast.success("Password generated! You can use it or create your own.");
    } catch (error) {
      toast.error("Failed to generate password");
    }
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseGeneratedPassword = () => {
    if (generatedPassword) {
      setForm({
        password: generatedPassword,
        confirmPassword: generatedPassword,
      });
      toast.success("Generated password applied!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.password || !form.confirmPassword) {
      toast.error("Both password fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (form.password.length > 32) {
      toast.error("Password must be 32 characters or less");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/user/reset-password", {
        resetToken: token,
        userId: userId,
        newPassword: form.password,
      });

      toast.success("Password has been reset successfully!");
      router.push("/auth");
    } catch (error: any) {
      if (error.response?.status === 400) {
        if (error.response.data.message?.includes("expired")) {
          setIsExpired(true);
          toast.error("Reset link has expired. Please request a new one.");
        } else {
          toast.error(error.response.data.message || "Invalid reset link");
        }
      } else {
        toast.error(error.response?.data?.message || "Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 8) return { strength: 25, label: "Too short", color: "bg-red-500" };
    if (password.length < 10) return { strength: 50, label: "Fair", color: "bg-amber-500" };
    if (password.length < 14) return { strength: 75, label: "Good", color: "bg-blue-500" };
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(form.password);

  // Invalid link state
  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating reset link...</p>
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

        {isExpired && (
          <Card className="mb-4 border-amber-300 bg-amber-50">
            <CardContent className="p-4 text-center">
              <p className="text-amber-800 font-medium">This reset link has expired</p>
              <Button
                onClick={() => router.push("/forgot-password")}
                className="mt-3 bg-amber-600 hover:bg-amber-700"
              >
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="space-y-1 text-center p-4 sm:p-6 pb-2">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl lg:text-2xl">
                Set New Password
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Enter your new password below. You can use the password generator or create your own.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-6 pt-2">
              
              {/* Password Generator Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <Label className="text-sm font-semibold text-blue-900">
                    Password Generator
                  </Label>
                </div>
                <p className="text-xs text-blue-700">
                  Generate a random password with only letters (uppercase & lowercase)
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="8"
                    max="32"
                    value={passwordLength}
                    onChange={(e) => setPasswordLength(Math.min(32, Math.max(8, parseInt(e.target.value) || 8)))}
                    className="w-20 bg-white text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    className="flex-1 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
                {generatedPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                      <Input
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="font-mono text-sm bg-transparent border-0 p-0 h-auto"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPassword}
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseGeneratedPassword}
                      className="w-full bg-white hover:bg-green-50 border-green-200 text-green-700 text-sm"
                    >
                      Use This Password
                    </Button>
                  </div>
                )}
              </div>

              {/* Password Fields */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    onChange={handleChange}
                    value={form.password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{passwordStrength.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {form.password.length}/32 characters (letters only)
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    onChange={handleChange}
                    value={form.confirmPassword}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-sm py-2"
                disabled={loading || !form.password || !form.confirmPassword || form.password !== form.confirmPassword}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth" className="text-blue-600 hover:underline font-medium">
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
