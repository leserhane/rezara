import { useQuery } from "@tanstack/react-query";

const FALLBACK = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, "");

export function usePublicBaseUrl(): string {
  const { data } = useQuery({
    queryKey: ["__config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) return { publicBaseUrl: "" };
      return res.json() as Promise<{ publicBaseUrl: string }>;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return data?.publicBaseUrl || FALLBACK;
}
