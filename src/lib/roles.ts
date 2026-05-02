import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

const roleOrder: AppRole[] = [
  "admin",
  "it_admin",
  "hr_admin",
  "procurement_admin",
  "shareholder_admin",
  "partner_admin",
  "manager",
  "employee",
  "shareholder",
  "partner",
  "vendor",
];

export interface UserRolesResponse {
  roles: AppRole[];
  primary: AppRole | null;
}

export async function fetchCurrentUserRoles(_accessToken?: string): Promise<UserRolesResponse> {
  // Use getSession() — reads from localStorage, no network call
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    throw new Error("No active session. Please sign in again.");
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  if (error) {
    throw new Error(error.message);
  }

  const roles = (data ?? []).map((r) => r.role as AppRole);
  const primary = roleOrder.find((role) => roles.includes(role)) ?? roles[0] ?? null;

  return { roles, primary };
}
