import type { AppRole } from "@/hooks/useUserRoles";

export const ADMIN_ROLES: AppRole[] = [
  "admin", "it_admin", "hr_admin", "procurement_admin",
  "shareholder_admin", "partner_admin",
];

export function pathForRole(role: AppRole | null | undefined): string {
  if (!role) return "/auth";
  if (ADMIN_ROLES.includes(role)) return "/admin";
  switch (role) {
    case "manager":
    case "employee":
      return "/employee";
    case "shareholder":
      return "/shareholder";
    case "partner":
      return "/partner";
    case "vendor":
    default:
      return "/dashboard";
  }
}
