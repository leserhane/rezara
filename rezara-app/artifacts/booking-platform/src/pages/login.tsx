import { useState, useRef } from "react";
import { useLocation } from "wouter";
import logoUrl from "@assets/ezara_1773754651962.png";
import { Redirect } from "wouter";
import { Phone, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@workspace/replit-auth-web";

type Step = "phone" | "otp";

export default function Login() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, refetch } = useAuth() as any;
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [testCode, setTestCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/dashboard" />;

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("login.otpSendError"));
        return;
      }
      if (data.otpCode) setTestCode(data.otpCode);
      setStep("otp");
    } catch {
      setError(t("login.otpSendError"));
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    setError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("login.otpInvalid"));
        setVerifying(false);
        return;
      }
      if (refetch) refetch();
      setLocation("/dashboard");
    } catch {
      setError(t("login.otpInvalid"));
      setVerifying(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      const code = newOtp.join("");
      handleVerifyOtp(code);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="p-6 md:p-8 w-full max-w-6xl mx-auto flex justify-start">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <img src={logoUrl} alt="Rezara" className="w-8 h-8 rounded object-contain" />
          <span className="text-xl font-bold tracking-tight brand-name">Rezara</span>
        </motion.div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#00C77A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#00C77A]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("login.phoneTitle")}</h1>
                <p className="text-slate-500 text-sm">{t("login.phoneSubtitle")}</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("login.phoneLabel")}
                  </label>
                  <Input
                    type="tel"
                    placeholder="+212 6XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                    dir="ltr"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">{t("login.phoneHint")}</p>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={!phone.trim() || sending}
                  className="w-full h-12 bg-[#00C77A] hover:bg-[#00b36d] text-white font-semibold rounded-xl text-base border-0"
                >
                  {sending ? t("login.sending") : t("login.sendCode")}
                  {!sending && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm"
            >
              {testCode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      {t("login.testMode")}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mb-2">{t("login.testModeDesc")}</p>
                  <div className="text-3xl font-mono font-bold text-amber-800 tracking-widest text-center py-2">
                    {testCode}
                  </div>
                </motion.div>
              )}

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#00C77A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-[#00C77A]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("login.otpTitle")}</h1>
                <p className="text-slate-500 text-sm">
                  {t("login.otpSubtitle")} <span className="font-medium text-slate-700">{phone}</span>
                </p>
              </div>

              <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={verifying}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl bg-white focus:border-[#00C77A] focus:outline-none focus:ring-2 focus:ring-[#00C77A]/20 transition-colors disabled:opacity-50"
                    autoFocus={i === 0}
                    dir="ltr"
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center mb-4">
                  {error}
                </p>
              )}

              {verifying && (
                <p className="text-center text-sm text-slate-500 mb-4">{t("login.verifying")}</p>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); setTestCode(null); }}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← {t("login.changePhone")}
                </button>
                <button
                  onClick={() => handleSendOtp({ preventDefault: () => {} } as any)}
                  className="text-sm text-[#00C77A] hover:text-[#00b36d] font-medium transition-colors"
                >
                  {t("login.resend")}
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t("login.secureNote")}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
