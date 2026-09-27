import { useState, useRef, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import logoUrl from "@assets/ezara_1773754651962.png";
import { Phone, ArrowRight, ShieldCheck, MessageCircle, Loader2, Link2, BellRing, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@workspace/replit-auth-web";
import { LanguageSwitcher } from "@/components/language-switcher";

type Step = "phone" | "otp";
const RESEND_COOLDOWN_S = 30;
const EMPTY_OTP = ["", "", "", "", "", ""];

export default function Login() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, refetch } = useAuth();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [testCode, setTestCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) return <Redirect to="/dashboard" />;

  async function sendOtp() {
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? t("login.tooManyRequests")
            : res.status === 400
              ? t("login.invalidPhone")
              : t("login.otpSendError"),
        );
        return;
      }
      setTestCode(data.otpCode ?? null);
      setOtp(EMPTY_OTP);
      setCooldown(RESEND_COOLDOWN_S);
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) setError(t("login.tooManyAttempts"));
        else if (typeof data.attemptsLeft === "number")
          setError(t("login.otpInvalidLeft", { count: data.attemptsLeft }));
        else setError(t("login.otpInvalid"));
        setOtp(EMPTY_OTP);
        setVerifying(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 0);
        return;
      }
      refetch();
      setLocation("/dashboard");
    } catch {
      setError(t("login.otpInvalid"));
      setVerifying(false);
    }
  }

  function fillFrom(index: number, digits: string) {
    const next = [...otp];
    for (let i = 0; i < digits.length && index + i < 6; i++) next[index + i] = digits[i];
    setOtp(next);
    setError("");
    const firstEmpty = next.findIndex((d) => d === "");
    otpRefs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus();
    if (next.every((d) => d !== "")) handleVerifyOtp(next.join(""));
  }

  function handleOtpChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      // iOS/Android one-time-code autofill and pastes land in a single box.
      fillFrom(digits.length >= 6 ? 0 : index, digits.slice(0, 6));
      return;
    }
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    setError("");
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) handleVerifyOtp(next.join(""));
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      fillFrom(0, pasted);
    }
  }

  const highlights = [
    { icon: CalendarCheck, text: t("login.point1") },
    { icon: Link2, text: t("login.point2") },
    { icon: BellRing, text: t("login.point3") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="px-5 py-4 md:px-8 md:py-6 w-full max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="" className="w-8 h-8 rounded object-contain" />
          <span className="text-xl font-bold tracking-tight brand-name">Rezara</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-12">
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-sm"
            >
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("login.phoneTitle")}</h1>
                <p className="text-slate-500 text-sm">{t("login.phoneSubtitle")}</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendOtp();
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("login.phoneLabel")}
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+212 6XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-base bg-white"
                    autoFocus
                    dir="ltr"
                    aria-describedby="phone-hint"
                  />
                  <p id="phone-hint" className="text-xs text-slate-400 mt-1.5">
                    {t("login.phoneHint")}
                  </p>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!phone.trim() || sending}
                  className="w-full h-12 font-semibold rounded-xl text-base gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {sending ? t("login.sending") : t("login.sendCode")}
                  {!sending && <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                </Button>
              </form>

              <ul className="mt-10 space-y-3">
                {highlights.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-sm"
            >
              {testCode ? (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">{t("login.testMode")}</p>
                  <p className="text-xs text-amber-700 mb-2">{t("login.testModeDesc")}</p>
                  <div className="text-3xl font-mono font-bold text-amber-800 tracking-widest text-center py-1" dir="ltr">
                    {testCode}
                  </div>
                </div>
              ) : null}

              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("login.otpTitle")}</h1>
                <p className="text-slate-500 text-sm">
                  {t("login.otpSubtitle")}{" "}
                  <span className="font-medium text-slate-700" dir="ltr">
                    {phone}
                  </span>
                </p>
                {!testCode && <p className="text-xs text-slate-400 mt-2">{t("login.noCodeHint")}</p>}
              </div>

              <div
                className="flex gap-2 justify-center mb-5"
                dir="ltr"
                onPaste={handleOtpPaste}
                role="group"
                aria-label={t("login.otpTitle")}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={t("login.digit", { n: i + 1 })}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={verifying}
                    className="w-11 h-14 sm:w-12 text-center text-xl font-bold border-2 border-slate-200 rounded-xl bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center mb-4">
                  {error}
                </p>
              )}

              {verifying && (
                <p className="text-center text-sm text-slate-500 mb-4 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("login.verifying")}
                </p>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp(EMPTY_OTP);
                    setError("");
                    setTestCode(null);
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {t("login.changePhone")}
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={cooldown > 0 || sending}
                  className="text-sm text-primary font-medium transition-colors disabled:text-slate-400"
                >
                  {cooldown > 0 ? t("login.resendIn", { s: cooldown }) : t("login.resend")}
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
