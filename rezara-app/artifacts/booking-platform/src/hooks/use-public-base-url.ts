import { useQuery } from "@tanstack/react-query";

const FALLBACK = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, "");

interface AppConfig {
  publicBaseUrl: string;
  reservationExpiryMinutes: number;
}

export function useAppConfig(): AppConfig {
  const { data } = useQuery({
    queryKey: ["__config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) return {} as Partial<AppConfig>;
      return res.json() as Promise<Partial<AppConfig>>;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    publicBaseUrl: data?.publicBaseUrl || FALLBACK,
    reservationExpiryMinutes: data?.reservationExpiryMinutes || 15,
  };
}

export function usePublicBaseUrl(): string {
  return useAppConfig().publicBaseUrl;
}
