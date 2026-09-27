import React from "react";
import { motion } from "framer-motion";
import logoUrl from "@assets/ezara_1773754651962.png";
import { ArrowRight, CalendarPlus, Link as LinkIcon, CheckCircle2, Shield, Clock, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n";

const LANGUAGES = [
  { code: "en", countryCode: "gb", label: "EN" },
  { code: "fr", countryCode: "fr", label: "FR" },
  { code: "ar", countryCode: "ma", label: "AR" },
] as const;

function LangSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("rezara_landing_lang", code);
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = code;
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
      {LANGUAGES.map(({ code, countryCode, label }) => {
        const active = i18n.language === code;
        return (
          <button
            key={code}
            onClick={() => handleChange(code)}
            title={label}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 select-none ${
              active
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <img
              src={`https://flagcdn.com/20x15/${countryCode}.png`}
              srcSet={`https://flagcdn.com/40x30/${countryCode}.png 2x`}
              width={20}
              height={15}
              alt={label}
              className="rounded-[2px] object-cover"
              style={{ display: "block" }}
            />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

const APP_URL = "/";

export default function Home() {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      icon: CalendarPlus,
      title: t("steps.s1Title"),
      description: t("steps.s1Desc"),
      iconBg: "bg-blue-50 text-blue-500 border-blue-100",
      iconHover: "group-hover:bg-blue-500 group-hover:text-white",
    },
    {
      number: 2,
      icon: LinkIcon,
      title: t("steps.s2Title"),
      description: t("steps.s2Desc"),
      iconBg: "bg-purple-50 text-purple-500 border-purple-100",
      iconHover: "group-hover:bg-purple-500 group-hover:text-white",
    },
    {
      number: 3,
      icon: CheckCircle2,
      title: t("steps.s3Title"),
      description: t("steps.s3Desc"),
      iconBg: "bg-emerald-50 text-[#00C896] border-emerald-100",
      iconHover: "group-hover:bg-[#00C896] group-hover:text-white",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: t("features.f1Title"),
      description: t("features.f1Desc"),
    },
    {
      icon: Clock,
      title: t("features.f2Title"),
      description: t("features.f2Desc"),
    },
    {
      icon: TrendingUp,
      title: t("features.f3Title"),
      description: t("features.f3Desc"),
    },
  ];

  const stats = [
    { value: t("stats.stat1Value"), label: t("stats.stat1Label") },
    { value: t("stats.stat2Value"), label: t("stats.stat2Label") },
    { value: t("stats.stat3Value"), label: t("stats.stat3Label") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Inter'] selection:bg-[#00C896] selection:text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          <motion.a
            href={APP_URL}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 no-underline"
          >
            <img src={logoUrl} alt="Rezara" className="w-8 h-8 rounded object-contain" />
            <span className="text-xl font-bold tracking-tight brand-name">Rezara</span>
          </motion.a>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <LangSwitcher />
            <a
              href={APP_URL}
              className="text-sm font-semibold text-slate-600 hover:text-[#00C896] transition-colors no-underline whitespace-nowrap"
            >
              {t("nav.signIn")}
            </a>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#00C896] border border-emerald-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" />
            {t("hero.badge")}
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-[1.1]">
            {t("hero.title").split("Rezara").map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="brand-name">Rezara</span>}
              </React.Fragment>
            ))}
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-20">
        <div className="relative">
          <div className="hidden md:block absolute top-[4.5rem] left-[calc(16.6%+2rem)] right-[calc(16.6%+2rem)] h-0.5 border-t-2 border-dashed border-slate-200 -z-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-sm border ${step.iconBg} ${step.iconHover} transition-colors duration-300`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="absolute -top-4 -left-4 w-9 h-9 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 shadow-sm text-sm">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-center text-slate-900 mb-12 tracking-tight"
          >
            {t("features.sectionTitle")}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00C896] flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
        >
          {stats.map((stat, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-4xl font-extrabold text-[#00C896] mb-2">{stat.value}</div>
              <div className="text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 md:p-16"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={logoUrl} alt="Rezara" className="w-12 h-12 rounded-xl object-contain shadow-lg" />
            <span className="text-2xl font-bold tracking-tight brand-name">Rezara</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            {t("cta.title").split("Rezara").map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="brand-name">Rezara</span>}
              </React.Fragment>
            ))}
          </h2>
          <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto">
            {t("cta.subtitle").split("Rezara").map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="brand-name">Rezara</span>}
              </React.Fragment>
            ))}
          </p>
          <a
            href={APP_URL}
            className="inline-flex items-center gap-2 bg-[#00C896] hover:bg-[#00b386] text-white text-lg font-semibold h-14 px-10 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 no-underline group"
          >
            {t("cta.button")}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="mt-6 text-slate-400 text-sm">
            {t("cta.existingAccount")}{" "}
            <a
              href={APP_URL}
              className="font-semibold text-slate-700 hover:text-[#00C896] transition-colors underline decoration-slate-200 underline-offset-4 hover:decoration-[#00C896]"
            >
              {t("cta.signIn")}
            </a>
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Rezara" className="w-6 h-6 rounded object-contain" />
            <span className="font-bold brand-name">Rezara</span>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} <span className="brand-name">Rezara</span>. {t("footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
