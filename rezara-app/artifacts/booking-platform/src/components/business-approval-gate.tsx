import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyBusiness, getGetMyBusinessQueryKey } from "@workspace/api-client-react";
import { Clock, XCircle, LogOut, Settings, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * Businesses need admin approval before they can take bookings. While pending
 * (or rejected) we explain what's happening instead of showing screens that
 * would fail. Settings is deliberately *not* wrapped by this gate so owners
 * can finish their profile while they wait.
 */
export function BusinessApprovalGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, logout } = useAuth();

  const { data: business, isLoading: bizLoading } = useGetMyBusiness({
    query: {
      queryKey: getGetMyBusinessQueryKey(),
      enabled: !!user && user.role !== "admin",
      retry: false,
    },
  });

  if (authLoading || bizLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label={t("common.loading")} />
      </div>
    );
  }

  if (!user || user.role === "admin") return <>{children}</>;

  // No profile yet: the pages themselves show the "set up your profile" step.
  if (!business || !business.status || business.status === "approved") return <>{children}</>;

  if (business.status === "pending") {
    const profileSteps = [
      { done: !!business.name, label: t("gate.stepName") },
      { done: !!business.phone, label: t("gate.stepPhone") },
      { done: !!business.address, label: t("gate.stepAddress") },
      { done: !!business.logo, label: t("gate.stepLogo") },
    ];
    const complete = profileSteps.every((s) => s.done);

    return (
      <div className="flex items-center justify-center py-6 md:py-16">
        <div className="bg-card rounded-3xl shadow-sm border border-border w-full max-w-md p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2">{t("gate.pendingTitle")}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {t("gate.pendingBody", { name: business.name })}
          </p>

          <div className="bg-muted/50 border border-border rounded-2xl px-5 py-4 mb-6 text-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {complete ? t("gate.profileComplete") : t("gate.profileChecklist")}
            </p>
            <ul className="space-y-2">
              {profileSteps.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/settings">
              <Button className="w-full h-11 rounded-xl gap-2">
                <Settings className="w-4 h-4" />
                {complete ? t("gate.editProfile") : t("gate.completeProfile")}
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-11 rounded-xl gap-2" onClick={logout}>
              <LogOut className="w-4 h-4 rtl:rotate-180" /> {t("nav.signOut")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-6 md:py-16">
      <div className="bg-card rounded-3xl shadow-sm border border-border w-full max-w-md p-8 md:p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">{t("gate.rejectedTitle")}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">{t("gate.rejectedBody")}</p>

        {business.statusNote && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 text-start">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">{t("gate.reason")}</p>
            <p className="text-sm text-red-800">{business.statusNote}</p>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">{t("gate.rejectedHelp")}</p>

        <div className="flex flex-col gap-3">
          <Link href="/settings">
            <Button variant="outline" className="w-full h-11 rounded-xl gap-2">
              <Settings className="w-4 h-4" /> {t("gate.editProfile")}
            </Button>
          </Link>
          <Button variant="ghost" className="w-full h-11 rounded-xl gap-2" onClick={logout}>
            <LogOut className="w-4 h-4 rtl:rotate-180" /> {t("nav.signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}
