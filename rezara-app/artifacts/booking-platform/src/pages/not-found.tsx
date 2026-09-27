import { Link } from "wouter";
import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("notFound.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("notFound.body")}</p>
        <Link href="/dashboard">
          <Button className="rounded-xl">{t("notFound.cta")}</Button>
        </Link>
      </div>
    </div>
  );
}
