import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const en = {
  nav: {
    signIn: "Sign in →",
  },
  hero: {
    badge: "Collect deposits. Reduce no-shows.",
    title: "How Rezara works",
    subtitle: "Collect booking deposits in 3 simple steps — no setup, no code, no friction.",
  },
  steps: {
    s1Title: "Create a Booking",
    s1Desc: "Add customer details, date, time, and deposit amount in seconds.",
    s2Title: "Send a Payment Link",
    s2Desc: "Customer receives a unique link and pays the deposit instantly via card.",
    s3Title: "Deposit Confirmed",
    s3Desc: "You get notified instantly. The booking is confirmed automatically.",
  },
  features: {
    sectionTitle: "Everything you need, nothing you don't",
    f1Title: "Secure payments",
    f1Desc: "Powered by PayPal — the same infrastructure trusted by millions of businesses worldwide.",
    f2Title: "Instant notifications",
    f2Desc: "Get notified the moment a deposit is paid. No more chasing confirmations.",
    f3Title: "Reduce no-shows",
    f3Desc: "Businesses using deposit links report up to 75% fewer no-shows.",
  },
  stats: {
    stat1Value: "2,400+",
    stat1Label: "Businesses using Rezara",
    stat2Value: "50K+",
    stat2Label: "Bookings processed per month",
    stat3Value: "75%",
    stat3Label: "Fewer no-shows on average",
  },
  cta: {
    title: "Sign up for Rezara & stop wasting bookings",
    subtitle: "Join thousands of restaurants, salons, and clinics already using Rezara.",
    button: "Start accepting deposits",
    existingAccount: "Already have an account?",
    signIn: "Sign in",
  },
  footer: {
    rights: "All rights reserved.",
  },
};

const fr: typeof en = {
  nav: {
    signIn: "Se connecter →",
  },
  hero: {
    badge: "Collectez des acomptes. Réduisez les absences.",
    title: "Comment fonctionne Rezara",
    subtitle: "Collectez des acomptes en 3 étapes simples — sans configuration, sans code, sans friction.",
  },
  steps: {
    s1Title: "Créer une réservation",
    s1Desc: "Ajoutez les coordonnées du client, la date, l'heure et le montant de l'acompte en quelques secondes.",
    s2Title: "Envoyer un lien de paiement",
    s2Desc: "Le client reçoit un lien unique et paie l'acompte instantanément par carte.",
    s3Title: "Acompte confirmé",
    s3Desc: "Vous êtes notifié instantanément. La réservation est confirmée automatiquement.",
  },
  features: {
    sectionTitle: "Tout ce dont vous avez besoin, rien de superflu",
    f1Title: "Paiements sécurisés",
    f1Desc: "Propulsé par PayPal — la même infrastructure utilisée par des millions d'entreprises dans le monde.",
    f2Title: "Notifications instantanées",
    f2Desc: "Soyez notifié dès qu'un acompte est payé. Fini de courir après les confirmations.",
    f3Title: "Réduire les absences",
    f3Desc: "Les entreprises utilisant des liens d'acompte signalent jusqu'à 75 % moins d'absences.",
  },
  stats: {
    stat1Value: "2 400+",
    stat1Label: "Entreprises utilisant Rezara",
    stat2Value: "50K+",
    stat2Label: "Réservations traitées par mois",
    stat3Value: "75%",
    stat3Label: "Moins d'absences en moyenne",
  },
  cta: {
    title: "Inscrivez-vous sur Rezara & arrêtez de perdre des réservations",
    subtitle: "Rejoignez des milliers de restaurants, salons et cliniques qui utilisent déjà Rezara.",
    button: "Commencer à accepter des acomptes",
    existingAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
  },
  footer: {
    rights: "Tous droits réservés.",
  },
};

const ar: typeof en = {
  nav: {
    signIn: "تسجيل الدخول →",
  },
  hero: {
    badge: "اجمع العربون. قلل حالات الغياب.",
    title: "كيف يعمل Rezara",
    subtitle: "اجمع عربون الحجز في 3 خطوات بسيطة — بدون إعداد، بدون كود، بدون تعقيد.",
  },
  steps: {
    s1Title: "إنشاء حجز",
    s1Desc: "أضف بيانات العميل والتاريخ والوقت ومبلغ العربون في ثوانٍ.",
    s2Title: "إرسال رابط الدفع",
    s2Desc: "يتلقى العميل رابطاً فريداً ويدفع العربون فوراً عبر البطاقة.",
    s3Title: "تأكيد العربون",
    s3Desc: "تتلقى إشعاراً فورياً. يتم تأكيد الحجز تلقائياً.",
  },
  features: {
    sectionTitle: "كل ما تحتاجه، لا أكثر ولا أقل",
    f1Title: "مدفوعات آمنة",
    f1Desc: "مدعوم بـ PayPal — نفس البنية التحتية التي يثق بها ملايين الشركات حول العالم.",
    f2Title: "إشعارات فورية",
    f2Desc: "احصل على إشعار فور دفع العربون. لا مزيد من ملاحقة التأكيدات.",
    f3Title: "تقليل حالات الغياب",
    f3Desc: "تُفيد الشركات التي تستخدم روابط العربون بانخفاض يصل إلى 75% في حالات الغياب.",
  },
  stats: {
    stat1Value: "+2,400",
    stat1Label: "شركة تستخدم Rezara",
    stat2Value: "+50K",
    stat2Label: "حجز يُعالج شهرياً",
    stat3Value: "75%",
    stat3Label: "أقل غياباً في المتوسط",
  },
  cta: {
    title: "سجّل في Rezara وتوقف عن خسارة حجوزاتك",
    subtitle: "انضم إلى آلاف المطاعم والصالونات والعيادات التي تستخدم Rezara بالفعل.",
    button: "ابدأ قبول العربون",
    existingAccount: "هل لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
  },
  footer: {
    rights: "جميع الحقوق محفوظة.",
  },
};

const SUPPORTED = ["en", "fr", "ar"] as const;
type SupportedLang = typeof SUPPORTED[number];

function detectLang(): SupportedLang {
  const saved = localStorage.getItem("rezara_landing_lang") as SupportedLang | null;
  if (saved && SUPPORTED.includes(saved)) return saved;
  for (const nav of navigator.languages ?? [navigator.language]) {
    const code = nav.split("-")[0].toLowerCase() as SupportedLang;
    if (SUPPORTED.includes(code)) return code;
  }
  return "en";
}

export const initialLang = detectLang();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr }, ar: { translation: ar } },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
