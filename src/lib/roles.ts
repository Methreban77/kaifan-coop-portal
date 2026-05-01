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

export async function fetchCurrentUserRoles(accessToken?: string): Promise<UserRolesResponse> {
  const token = accessToken ?? (await supabase.auth.getSession()).data.session?.access_token;

  if (!token) {
    throw new Error("No active session. Please sign in again.");
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-roles`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json()) as Partial<UserRolesResponse> & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? `Unable to load roles (${response.status})`);
  }

  const roles = data?.roles ?? [];
  const primary = data?.primary ?? roleOrder.find((role) => roles.includes(role)) ?? roles[0] ?? null;

  return { roles, primary };
}
