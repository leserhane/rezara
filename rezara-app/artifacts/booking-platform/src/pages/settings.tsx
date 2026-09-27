import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMyBusiness, useUpsertBusiness, getGetMyBusinessQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Store, Save, Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpload } from "@workspace/object-storage-web";

const schema = z.object({
  name: z.string().min(2, "Business name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function LogoUploader({
  currentLogo,
  onLogoChange,
}: {
  currentLogo: string;
  onLogoChange: (url: string) => void;
}) {
  const { t } = useTranslation();
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
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      >
        {preview ? (
          <img
            src={preview}
            alt="Business logo"
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

  const { data: business, isLoading: isFetching } = useGetMyBusiness({
    query: { queryKey: getGetMyBusinessQueryKey(), retry: false }
  });

  const upsertMutation = useUpsertBusiness();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const logoValue = watch("logo") || "";

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
      await upsertMutation.mutateAsync({ data });
      toast({
        title: t("settings.toastSaved"),
        description: t("settings.toastSavedDesc"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("settings.toastError"),
        description: error.message || t("settings.toastErrorMsg"),
      });
    }
  };

  if (isFetching) {
    return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

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
                  <label className="text-sm font-semibold">{t("settings.businessName")} <span className="text-destructive">{t("settings.required")}</span></label>
                  <Input
                    {...register("name")}
                    placeholder="The Great Salon"
                    className="h-11 rounded-xl subtle-ring font-bold text-lg"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground text-xs">{t("settings.logoUrl")}</label>
                  <Input
                    {...register("logo")}
                    placeholder="https://example.com/logo.png"
                    className="h-9 rounded-xl subtle-ring text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Click the box on the left to upload an image, or paste a URL here.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
              <div className="space-y-2">
                <label className="text-sm font-semibold">{t("settings.contactPhone")}</label>
                <Input
                  {...register("phone")}
                  placeholder="+1 (555) 123-4567"
                  className="h-11 rounded-xl subtle-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{t("settings.address")}</label>
                <Input
                  {...register("address")}
                  placeholder="123 Main St, City, ST 12345"
                  className="h-11 rounded-xl subtle-ring"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">{t("settings.description")}</label>
                <Textarea
                  {...register("description")}
                  placeholder={t("settings.descriptionPlaceholder")}
                  className="min-h-[120px] rounded-xl subtle-ring"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border">
              <Button
                type="submit"
                size="lg"
                className="rounded-xl px-8 shadow-lg shadow-primary/25"
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {business ? t("settings.update") : t("settings.create")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
