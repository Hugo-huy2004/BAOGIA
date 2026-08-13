import { useQuery } from "@tanstack/react-query";
import {
  fetchServerBootstrapData,
  getLocalBootstrapCache,
} from "../services/bootstrapService";

export const memberBootstrapKey = (email) => [
  "member",
  "bootstrap",
  String(email || "").trim().toLowerCase(),
];

export function useMemberBootstrap(email, enabled = true) {
  const cached = getLocalBootstrapCache(email);

  return useQuery({
    queryKey: memberBootstrapKey(email),
    queryFn: ({ signal }) => fetchServerBootstrapData({ signal, email }),
    enabled: enabled && Boolean(email),
    initialData: cached || undefined,
    // Local data paints immediately but is always revalidated on mount.
    initialDataUpdatedAt: cached ? 0 : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
