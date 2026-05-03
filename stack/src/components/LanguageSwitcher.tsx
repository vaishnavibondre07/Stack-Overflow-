import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Globe, Check } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

const LanguageSwitcher = () => {
  const { language, t, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [languageChangeId, setLanguageChangeId] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone" | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleLanguageSelect = async (langCode: string) => {
    if (langCode === language) {
      setShowDialog(false);
      return;
    }

    // If user is not logged in, allow language change without authentication
    if (!user) {
      setLanguage(langCode);
      setShowDialog(false);
      toast.success("Language changed successfully");
      return;
    }

    // For logged-in users, require authentication
    setSelectedLanguage(langCode);
    setLoading(true);

    try {
      const res = await axiosInstance.post("/user/language/change", {
        newLanguage: langCode,
      });

      setLanguageChangeId(res.data.languageChangeId);
      setVerificationMethod(res.data.verificationMethod);
      setShowDialog(false);
      setShowOTPDialog(true);
      toast.info(res.data.message);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to request language change");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    if (!otp || otp.length !== 6 || !languageChangeId || !selectedLanguage) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);

    try {
      const res = await axiosInstance.post("/user/language/verify", {
        otp,
        languageChangeId,
      });

      // Update language in context and localStorage
      setLanguage(selectedLanguage);
      setShowOTPDialog(false);
      setOtp("");
      setSelectedLanguage(null);
      setLanguageChangeId(null);
      setVerificationMethod(null);
      toast.success(res.data.message || "Language changed successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">
              {languages.find((l) => l.code === language)?.flag}{" "}
              {languages.find((l) => l.code === language)?.name}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("selectLanguage")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={loading}
              >
                <span className="mr-2">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {language === lang.code && <Check className="w-4 h-4" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("verifyToChangeLanguage")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>
                Enter OTP sent to your email
              </Label>
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOTPDialog(false);
                  setOtp("");
                  setSelectedLanguage(null);
                  setLanguageChangeId(null);
                }}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleOTPVerify}
                disabled={otp.length !== 6 || otpLoading}
                className="flex-1"
              >
                {otpLoading ? t("loading") : t("verify")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LanguageSwitcher;

