import { useState, useRef, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Redirect } from "wouter";
import { useAdminGetReservations, useAdminGetPayments, getAdminGetReservationsQueryKey, getAdminGetPaymentsQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Building2, RefreshCw, Upload, X, CheckCircle2, ImageIcon,
  History, Phone, Pencil, KeyRound, Copy, Check, MapPin, FileText, Save,
} from "lucide-react";

function fmtMAD(amount: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 }).format(amount);
}

function logoSrc(logo?: string | null) {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  return `/api/storage${logo.replace(/^\/api\/storage/, "")}`;
}

/* ─── Types ─── */
interface AdminBusiness {
  id: number;
  name: string;
  logo?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  ownerPhone?: string | null;
  status: "pending" | "approved" | "rejected";
  statusNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BusinessRevenue {
  id: number;
  name: string;
  logo?: string | null;
  phone?: string | null;
  createdAt: string;
  totalRevenue: number;
  unsettledRevenue: number;
  settlementCount: number;
  lastSettlement: { id: number; settledAmount: number; evidenceUrl: string; notes?: string | null; settledBy: string; createdAt: string } | null;
  settlements: { id: number; settledAmount: number; evidenceUrl: string; notes?: string | null; settledBy: string; createdAt: string }[];
}

/* ─── Business Edit Modal ─── */
function BusinessEditModal({ business, onClose, onSaved }: { business: AdminBusiness; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: business.name ?? "", phone: business.phone ?? "", logo: business.logo ?? "", address: business.address ?? "", description: business.description ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<{ code: string; phone: string } | null>(null);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusNote, setStatusNote] = useState(business.statusNote ?? "");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(business.status);

  function set(key: keyof typeof form, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleStatusChange(status: "approved" | "rejected" | "pending") {
    setUpdatingStatus(true); setError("");
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, statusNote: statusNote.trim() || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setCurrentStatus(status);
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setUpdatingStatus(false); }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Business name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() || undefined, logo: form.logo.trim() || undefined, address: form.address.trim() || undefined, description: form.description.trim() || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Save failed"); }
      onSaved();
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleGenerateOtp() {
    setGeneratingOtp(true); setGeneratedOtp(null);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/generate-otp`, {
        method: "POST", credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setGeneratedOtp({ code: data.otpCode, phone: data.phone });
    } catch (e: any) { setError(e.message); }
    finally { setGeneratingOtp(false); }
  }

  function copyCode() {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            {logoSrc(business.logo) ? (
              <img src={logoSrc(business.logo)!} alt={business.name} className="w-10 h-10 rounded-xl object-contain border bg-slate-50" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-400" /></div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900">{business.name}</h2>
              <p className="text-xs text-slate-400">ID #{business.id} · Client since {format(new Date(business.createdAt), "MMM yyyy")}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Owner phone (read-only) */}
          {business.ownerPhone && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Login phone: <span className="font-semibold">{business.ownerPhone}</span></span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Name *</label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Business name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Phone</label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+212 6XX XXX XXX" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Logo URL</label>
              <Input value={form.logo} onChange={e => set("logo", e.target.value)} placeholder="https://… or leave blank" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Casablanca" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Description</label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Public description shown to customers…" className="resize-none h-20 text-sm" />
            </div>
          </div>

          {/* Approval Status */}
          <div className={`rounded-xl p-4 border-2 ${
            currentStatus === "approved" ? "border-emerald-200 bg-emerald-50" :
            currentStatus === "rejected" ? "border-red-200 bg-red-50" :
            "border-amber-200 bg-amber-50"
          }`}>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              {currentStatus === "approved" && <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-emerald-800">Account Approved</span></>}
              {currentStatus === "pending" && <><RefreshCw className="w-4 h-4 text-amber-600" /><span className="text-amber-800">Pending Review</span></>}
              {currentStatus === "rejected" && <><X className="w-4 h-4 text-red-600" /><span className="text-red-800">Account Rejected</span></>}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Note to client (shown on rejection)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Reason for rejection or approval note…"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {currentStatus !== "approved" && (
                  <button
                    onClick={() => handleStatusChange("approved")}
                    disabled={updatingStatus}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                )}
                {currentStatus !== "rejected" && (
                  <button
                    onClick={() => handleStatusChange("rejected")}
                    disabled={updatingStatus}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                )}
                {currentStatus !== "pending" && (
                  <button
                    onClick={() => handleStatusChange("pending")}
                    disabled={updatingStatus}
                    className="text-sm font-medium py-2 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generate Login Code */}
          <div className="border border-dashed border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-amber-500" /> Generate Login Code</p>
                <p className="text-xs text-slate-400 mt-0.5">Create a one-time code to share with the client (valid 15 min)</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleGenerateOtp} disabled={generatingOtp} className="shrink-0">
                {generatingOtp ? "Generating…" : "Generate"}
              </Button>
            </div>

            {generatedOtp && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-600 mb-2">Share this code with <span className="font-semibold">{generatedOtp.phone}</span>:</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold text-amber-800 tracking-widest">{generatedOtp.code}</span>
                  <button onClick={copyCode} className="ml-auto flex items-center gap-1.5 text-xs font-medium text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
                <p className="text-xs text-amber-500 mt-2">Expires in 15 minutes · Single use</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#00C77A] hover:bg-[#00b36d] text-white border-0">
            {saving ? "Saving…" : <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Reset Revenue Modal ─── */
function ResetModal({ business, onClose, onSuccess }: { business: BusinessRevenue; onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setError("");
  }

  async function handleSubmit() {
    if (!file) { setError("Please upload evidence before resetting."); return; }
    if (business.unsettledRevenue === 0) { setError("Revenue is already at 0 — nothing to reset."); return; }
    setUploading(true); setError("");
    try {
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Failed to upload evidence");

      const settleRes = await fetch(`/api/admin/revenue/${business.id}/settle`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ evidenceUrl: objectPath, notes: notes.trim() || undefined }),
      });
      if (!settleRes.ok) { const d = await settleRes.json(); throw new Error(d.error ?? "Settlement failed"); }

      onSuccess(); onClose();
    } catch (err: any) { setError(err.message ?? "An error occurred"); }
    finally { setUploading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div><h2 className="text-lg font-bold text-slate-900">Reset Revenue</h2><p className="text-sm text-slate-500 mt-0.5">{business.name}</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Revenue to Reset</p>
            <p className="text-3xl font-bold text-amber-800">{fmtMAD(business.unsettledRevenue)}</p>
            <p className="text-xs text-amber-600 mt-1">This will be recorded as settled and the counter resets to 0</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Evidence <span className="text-red-500">*</span></label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${preview ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-slate-300 bg-slate-50"}`}
              onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            >
              {preview ? (
                <div className="space-y-2">
                  <img src={preview} alt="Evidence" className="max-h-32 mx-auto rounded-lg object-contain" />
                  <p className="text-xs text-emerald-600 font-medium">{file?.name}</p>
                  <p className="text-xs text-slate-400">Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">Drop image or click to upload</p>
                  <p className="text-xs text-slate-400">Bank transfer receipt, cash confirmation, etc.</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (optional)</label>
            <Textarea placeholder="e.g. Bank transfer ref #12345, paid on-site, etc." value={notes} onChange={e => setNotes(e.target.value)} className="resize-none h-20 text-sm" />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={uploading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading || business.unsettledRevenue === 0} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
            {uploading ? <span className="flex items-center gap-2"><Upload className="w-4 h-4 animate-bounce" /> Uploading…</span> : <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Confirm Reset</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── History Modal ─── */
function HistoryModal({ business, onClose }: { business: BusinessRevenue; onClose: () => void }) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div><h2 className="text-lg font-bold text-slate-900">Settlement History</h2><p className="text-sm text-slate-500 mt-0.5">{business.name}</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {business.settlements.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No settlements yet.</p>
          ) : (
            <div className="space-y-4">
              {business.settlements.map(s => (
                <div key={s.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{fmtMAD(s.settledAmount)}</p>
                      <p className="text-xs text-slate-400">{format(new Date(s.createdAt), "dd MMM yyyy 'at' HH:mm")}</p>
                    </div>
                    <button onClick={() => setViewingImage(`/api/storage${s.evidenceUrl}`)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 border border-emerald-200 rounded-lg px-2 py-1">
                      <ImageIcon className="w-3 h-3" /> View Evidence
                    </button>
                  </div>
                  {s.notes && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{s.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {viewingImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80" onClick={() => setViewingImage(null)}>
          <img src={viewingImage} alt="Evidence" className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

/* ─── Quick Approve Button ─── */
function QuickApproveButton({ businessId, onDone }: { businessId: number; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  async function approve() {
    setLoading(true);
    try {
      await fetch(`/api/admin/businesses/${businessId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "approved" }),
      });
      onDone();
    } finally { setLoading(false); }
  }
  return (
    <button
      onClick={approve}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
    >
      <CheckCircle2 className="w-3.5 h-3.5" /> {loading ? "…" : "Approve"}
    </button>
  );
}

/* ─── Main Admin Panel ─── */
export default function AdminPanel() {
  const { user, isLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  const [resetModal, setResetModal] = useState<BusinessRevenue | null>(null);
  const [historyModal, setHistoryModal] = useState<BusinessRevenue | null>(null);
  const [editModal, setEditModal] = useState<AdminBusiness | null>(null);

  useEffect(() => {
    if (!isLoading && user && user.role !== "admin") {
      logout();
    }
  }, [user, isLoading]);

  const { data: reservations } = useAdminGetReservations({ query: { queryKey: getAdminGetReservationsQueryKey(), enabled: user?.role === "admin" } });
  const { data: payments } = useAdminGetPayments({ query: { queryKey: getAdminGetPaymentsQueryKey(), enabled: user?.role === "admin" } });

  const { data: adminBusinesses, refetch: refetchBusinesses } = useQuery<AdminBusiness[]>({
    queryKey: ["admin", "businesses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/businesses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: user?.role === "admin",
  });

  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery<BusinessRevenue[]>({
    queryKey: ["admin", "revenue"],
    queryFn: async () => {
      const res = await fetch("/api/admin/revenue", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: user?.role === "admin",
  });

  if (isLoading || user?.role !== "admin") return null;

  const totalUnsettled = revenueData?.reduce((acc, b) => acc + b.unsettledRevenue, 0) ?? 0;
  const totalAllTime = revenueData?.reduce((acc, b) => acc + b.totalRevenue, 0) ?? 0;

  return (
    <div className="space-y-6">
      {resetModal && <ResetModal business={resetModal} onClose={() => setResetModal(null)} onSuccess={() => refetchRevenue()} />}
      {historyModal && <HistoryModal business={historyModal} onClose={() => setHistoryModal(null)} />}
      {editModal && <BusinessEditModal business={editModal} onClose={() => setEditModal(null)} onSaved={() => { refetchBusinesses(); refetchRevenue(); }} />}

      <div>
        <h1 className="text-3xl font-bold font-display text-red-600">Super Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Platform-wide management & revenue tracking.</p>
      </div>

      <Tabs defaultValue="businesses" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4 mb-8">
          <TabsTrigger value="businesses" className="relative">
            Businesses
            {(adminBusinesses?.filter(b => b.status === "pending").length ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {adminBusinesses!.filter(b => b.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* ── BUSINESSES TAB ── */}
        <TabsContent value="businesses">
          {!adminBusinesses?.length ? (
            <div className="text-center py-20 text-slate-400">No businesses registered yet.</div>
          ) : (() => {
            const pending = adminBusinesses.filter(b => b.status === "pending");
            const others = adminBusinesses.filter(b => b.status !== "pending");
            const statusBadge = (s: AdminBusiness["status"]) => {
              if (s === "approved") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Approved</span>;
              if (s === "rejected") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Rejected</span>;
              return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Pending</span>;
            };

            const BusinessCard = ({ b }: { b: AdminBusiness }) => (
              <div className={`relative rounded-2xl shadow-sm p-5 text-left ${
                b.status === "pending" ? "bg-amber-50 border-2 border-amber-200" :
                b.status === "rejected" ? "bg-red-50 border border-red-100" :
                "bg-white border border-slate-100"
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  {logoSrc(b.logo) ? (
                    <img src={logoSrc(b.logo)!} alt={b.name} className="w-14 h-14 rounded-xl object-contain border bg-white shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                      <Building2 className="w-7 h-7 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 truncate text-base">{b.name}</p>
                      {statusBadge(b.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Since {format(new Date(b.createdAt), "MMM yyyy")}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {b.ownerPhone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate font-medium">{b.ownerPhone}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="truncate">{b.phone}</span>
                    </div>
                  )}
                </div>

                {b.status === "pending" && (
                  <div className="flex gap-2 mb-3">
                    <QuickApproveButton businessId={b.id} onDone={refetchBusinesses} />
                    <button
                      onClick={() => setEditModal(b)}
                      className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Reject…
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setEditModal(b)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg py-1.5 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit profile
                </button>
              </div>
            );

            return (
              <div className="space-y-6">
                {pending.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide">Awaiting Approval ({pending.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pending.map(b => <BusinessCard key={b.id} b={b} />)}
                    </div>
                  </div>
                )}
                {others.length > 0 && (
                  <div>
                    {pending.length > 0 && <div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Active Clients ({others.length})</h3></div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {others.map(b => <BusinessCard key={b.id} b={b} />)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* ── REVENUE TAB ── */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Platform Revenue</p>
              <p className="text-3xl font-bold text-slate-900">{fmtMAD(totalAllTime)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Unsettled (Current Period)</p>
              <p className="text-3xl font-bold text-amber-800">{fmtMAD(totalUnsettled)}</p>
            </div>
          </div>

          {revenueLoading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : !revenueData?.length ? (
            <div className="text-center py-16 text-slate-400">No businesses yet.</div>
          ) : (
            <div className="space-y-4">
              {revenueData.map(business => (
                <div key={business.id} className="bg-white border rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {logoSrc(business.logo) ? (
                        <img src={logoSrc(business.logo)!} alt={business.name} className="w-10 h-10 rounded-xl object-contain border bg-slate-50 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{business.name}</p>
                        <p className="text-xs text-slate-400">Since {format(new Date(business.createdAt), "MMM yyyy")}{business.phone && ` · ${business.phone}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">All-time</p>
                        <p className="font-bold text-slate-700">{fmtMAD(business.totalRevenue)}</p>
                      </div>
                      <div className="text-right min-w-[110px]">
                        <p className="text-xs text-amber-600 font-medium">Current period</p>
                        <p className={`font-bold text-xl ${business.unsettledRevenue > 0 ? "text-amber-700" : "text-slate-400"}`}>{fmtMAD(business.unsettledRevenue)}</p>
                        {business.lastSettlement && <p className="text-xs text-slate-400">Last reset {format(new Date(business.lastSettlement.createdAt), "dd MMM yyyy")}</p>}
                      </div>
                      <div className="flex gap-2">
                        {business.settlementCount > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setHistoryModal(business)} className="h-9 gap-1.5 text-xs">
                            <History className="w-3.5 h-3.5" /> History ({business.settlementCount})
                          </Button>
                        )}
                        <Button size="sm" onClick={() => setResetModal(business)} disabled={business.unsettledRevenue === 0} className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 disabled:opacity-40">
                          <RefreshCw className="w-3.5 h-3.5" /> Reset to 0
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── RESERVATIONS TAB ── */}
        <TabsContent value="reservations" className="bg-card rounded-2xl border shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr><th className="pb-3">ID</th><th className="pb-3">Business</th><th className="pb-3">Customer</th><th className="pb-3">Status</th></tr>
            </thead>
            <tbody className="divide-y">
              {reservations?.map(r => (
                <tr key={r.id} className="h-12">
                  <td className="font-mono">{r.id}</td>
                  <td className="font-bold">{r.business.name}</td>
                  <td>{r.customerName}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        {/* ── PAYMENTS TAB ── */}
        <TabsContent value="payments" className="bg-card rounded-2xl border shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr><th className="pb-3">ID</th><th className="pb-3">Business</th><th className="pb-3">Amount</th><th className="pb-3">Status</th></tr>
            </thead>
            <tbody className="divide-y">
              {payments?.map(p => (
                <tr key={p.id} className="h-12">
                  <td className="font-mono">{p.id}</td>
                  <td>{p.businessId}</td>
                  <td className="font-bold">{fmtMAD(p.amount)}</td>
                  <td>{p.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
