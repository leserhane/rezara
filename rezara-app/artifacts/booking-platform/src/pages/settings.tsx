import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMyBusiness, useUpsertBusiness, getGetMyBusinessQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Camera, X, Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpload } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiErrorMessage } from "@/lib/errors";

function LogoUploader({
  currentLogo,
  onLogoChange,
}: {
  currentLogo: string;
  onLogoChange: (url: string) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentLogo);

  useEffect(() => {
    setPreview(currentLogo);
  }, [currentLogo]);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      const servingUrl = `/api/storage${response.objectPath}`;
      setPreview(servingUrl);
      onLogoChange(servingUrl);
    },
    onError: (err) => {
      console.error("Upload failed", err);
      setPreview(currentLogo);
      toast({ variant: "destructive", title: t("settings.uploadFailed") });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: t("settings.uploadTooLarge") });
      e.target.value = "";
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    await uploadFile(file);
    e.target.value = "";
  };

  const handleClear = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setPreview("");
    onLogoChange("");
  };

  return (
    <div className="shrink-0">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative w-32 h-32 rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/40 transition-colors overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        disabled={isUploading}
        aria-label={preview ? t("settings.changeLogo") : t("settings.uploadLogo")}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground group-hover:text-primary transition-colors">
            <Camera className="w-8 h-8" />
            <span className="text-xs font-medium">{t("settings.uploadLogo")}</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <span className="text-xs text-white font-medium">{Math.round(progress)}%</span>
          </div>
        )}

        {!isUploading && preview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </button>

      {preview && !isUploading && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-3 h-3" /> {t("settings.removeLogo")}
        </button>
      )}
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t("settings.nameRequired")),
        phone: z.string().optional(),
        address: z.string().optional(),
        description: z.string().max(280, t("settings.descriptionTooLong")).optional(),
        logo: z.string().optional(),
      }),
    [t],
  );
  type FormData = z.infer<typeof schema>;

  const { data: business, isLoading: isFetching } = useGetMyBusiness({
    query: { queryKey: getGetMyBusinessQueryKey(), retry: false }
  });

  const upsertMutation = useUpsertBusiness();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const logoValue = watch("logo") || "";
  const nameValue = watch("name") || "";
  const descriptionValue = watch("description") || "";

  useEffect(() => {
    if (business) {
      reset({
        name: business.name,
        phone: business.phone || "",
        address: business.address || "",
        description: business.description || "",
        logo: business.logo || "",
      });
    }
  }, [business, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const isFirstSave = !business;
      const saved = await upsertMutation.mutateAsync({ data });
      // Keep the sidebar, approval gate and dashboard in sync with the new profile.
      queryClient.setQueryData(getGetMyBusinessQueryKey(), saved);
      await queryClient.invalidateQueries({ queryKey: getGetMyBusinessQueryKey() });
      reset(data);
      toast({
        title: t("settings.toastSaved"),
        description: t("settings.toastSavedDesc"),
      });
      if (isFirstSave) setLocation("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("settings.toastError"),
        description: apiErrorMessage(error, t("settings.toastErrorMsg")),
      });
    }
  };

  if (isFetching) {
    return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid lg:grid-cols-[1fr_18rem] gap-6 items-start">
      <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      {!business && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-semibold">{t("settings.firstTimeTitle")}</p>
          <p className="text-muted-foreground mt-0.5">{t("settings.firstTimeBody")}</p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <LogoUploader
                currentLogo={logoValue}
                onLogoChange={(url) => setValue("logo", url, { shouldValidate: true })}
              />

              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <label htmlFor="biz-name" className="text-sm font-semibold">{t("settings.businessName")} <span className="text-destructive">{t("settings.required")}</span></label>
                  <Input
                    id="biz-name"
                    {...register("name")}
                    placeholder={t("settings.namePlaceholder")}
                    className="h-11 rounded-xl subtle-ring font-bold text-lg"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="biz-logo" className="font-semibold text-muted-foreground text-xs">{t("settings.logoUrl")}</label>
                  <Input
                    id="biz-logo"
                    dir="ltr"
                    {...register("logo")}
                    placeholder="https://example.com/logo.png"
                    className="h-9 rounded-xl subtle-ring text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{t("settings.logoHint")}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
              <div className="space-y-2">
                <label htmlFor="biz-phone" className="text-sm font-semibold">{t("settings.contactPhone")}</label>
                <Input
                  id="biz-phone"
                  type="tel"
                  dir="ltr"
                  {...register("phone")}
                  placeholder="+212 5XX XXX XXX"
                  className="h-11 rounded-xl subtle-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="biz-address" className="text-sm font-semibold">{t("settings.address")}</label>
                <Input
                  id="biz-address"
                  {...register("address")}
                  placeholder={t("settings.addressPlaceholder")}
                  className="h-11 rounded-xl subtle-ring"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="biz-description" className="text-sm font-semibold">{t("settings.description")}</label>
                <Textarea
                  id="biz-description"
                  {...register("description")}
                  placeholder={t("settings.descriptionPlaceholder")}
                  className="min-h-[120px] rounded-xl subtle-ring"
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                <p className="text-xs text-muted-foreground text-end tabular-nums">{descriptionValue.length}/280</p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border">
              <Button
                type="submit"
                size="lg"
                className="rounded-xl px-8 shadow-lg shadow-primary/25"
                disabled={upsertMutation.isPending || (!!business && !isDirty)}
              >
                {upsertMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {business ? t("settings.update") : t("settings.create")}
              </Button>
            </div>
          </form>
        </div>
      </div>
      </div>

      {/* Live preview of the header customers see on the payment page */}
      <aside className="hidden lg:block sticky top-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> {t("settings.previewTitle")}
        </p>
        <div className="rounded-3xl overflow-hidden border border-border shadow-sm bg-white">
          <div className="bg-slate-900 px-5 py-7 text-center">
            {logoValue ? (
              <img src={logoValue} alt="" className="w-16 h-16 rounded-2xl bg-white p-1 mx-auto mb-3 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">{(nameValue || "?")[0]}</span>
              </div>
            )}
            <p className="text-lg font-bold text-white truncate">{nameValue || t("settings.namePlaceholder")}</p>
            {descriptionValue && <p className="text-slate-300 text-xs mt-1 line-clamp-3">{descriptionValue}</p>}
          </div>
          <div className="p-4 space-y-2">
            <div className="h-9 rounded-xl bg-slate-100" />
            <div className="h-9 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-amber-300/70" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{t("settings.previewHint")}</p>
      </aside>
    </div>
  );
}
