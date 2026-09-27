import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Clock, XCircle, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";

interface BusinessStatus {
  status: "pending" | "approved" | "rejected";
  statusNote?: string | null;
  name?: string;
}

export function BusinessApprovalGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, logout } = useAuth();

  const { data: business, isLoading: bizLoading } = useQuery<BusinessStatus>({
    queryKey: ["business", "me", "status"],
    queryFn: async () => {
      const res = await fetch("/api/businesses/me", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch business");
      return res.json();
    },
    enabled: !!user && user.role !== "admin",
    retry: false,
  });

  if (authLoading || bizLoading) return null;

  if (!user || user.role === "admin") return <>{children}</>;

  if (!business || business.status === "approved") return <>{children}</>;

  if (business.status === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Under Review</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Your business profile has been submitted and is currently being reviewed by the Rezara team.
            You will be notified once your account is activated.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8 text-left">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">What to do now</p>
            <p className="text-sm text-amber-800">
              Make sure your business profile is complete — our team will review it and activate your account shortly.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/settings">
              <a className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#00C77A] hover:bg-[#00b36d] text-white font-semibold text-sm transition-colors">
                <Settings className="w-4 h-4" /> Complete Your Profile
              </a>
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (business.status === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Not Approved</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Unfortunately, your business account application was not approved.
          </p>

          {business.statusNote && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 text-left">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Reason</p>
              <p className="text-sm text-red-800">{business.statusNote}</p>
            </div>
          )}

          <p className="text-sm text-slate-400 mb-8">
            If you believe this is a mistake, please contact us directly.
          </p>

          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
