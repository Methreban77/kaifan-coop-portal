import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const roleOrder = [
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

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

function decodeJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(decoded);
    return claims.sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!authHeader?.startsWith("Bearer ") || !token) {
      return Response.json(
        { error: "Missing authorization" },
        { status: 401, headers: corsHeaders },
      );
    }

    // Decode JWT to get userId (already verified by Supabase edge runtime)
    const userId = decodeJwtSub(token);
    if (!userId) {
      return Response.json(
        { error: "Invalid token" },
        { status: 401, headers: corsHeaders },
      );
    }

    // Try service role client first, fall back to user-context client
    const clientKey = serviceRoleKey || anonKey;
    const clientOptions = serviceRoleKey
      ? { auth: { persistSession: false, autoRefreshToken: false } }
      : {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false, autoRefreshToken: false },
        };

    const client = createClient(supabaseUrl, clientKey, clientOptions);

    const { data, error } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("user-roles: db query failed", error);
      return Response.json(
        { error: "Database temporarily unavailable", code: error.code ?? "DB_ERROR" },
        { status: 503, headers: corsHeaders },
      );
    }

    const roles = (data ?? []).map((row: { role: string }) => row.role);
    const primary = roleOrder.find((role) => roles.includes(role)) ?? roles[0] ?? null;

    return Response.json({ roles, primary }, { headers: corsHeaders });
  } catch (error) {
    console.error("user-roles function failed", error);
    return Response.json(
      { error: "Unable to load roles" },
      { status: 500, headers: corsHeaders },
    );
  }
});
