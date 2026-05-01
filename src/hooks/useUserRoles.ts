import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchCurrentUserRoles, type AppRole } from "@/lib/roles";

export type { AppRole } from "@/lib/roles";

export function useUserRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    retry: 4,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    queryFn: async (): Promise<AppRole[]> => {
      if (!user) return [];
      const { roles } = await fetchCurrentUserRoles();
      return roles;
    },
  });
}

export function usePrimaryRole() {
  const { data: roles, isLoading } = useUserRoles();
  const order: AppRole[] = [
    "admin", "it_admin", "hr_admin", "procurement_admin",
    "shareholder_admin", "partner_admin",
    "manager", "employee", "shareholder", "partner", "vendor",
  ];
  const primary = roles?.length
    ? order.find((r) => roles.includes(r)) ?? roles[0]
    : null;
  return { primary, roles: roles ?? [], isLoading };
}
