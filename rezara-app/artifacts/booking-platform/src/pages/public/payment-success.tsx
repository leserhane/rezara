import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-[2rem] p-10 text-center shadow-xl border border-gray-100"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </motion.div>
        
        <h1 className="text-3xl font-black font-display text-gray-900 mb-4">{t("paymentResult.successTitle")}</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {t("paymentResult.successBody")}
        </p>
        
        <p className="text-sm font-medium text-gray-400">{t("paymentResult.close")}</p>
      </motion.div>
    </div>
  );
}
