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
const publishableKey =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

    // 1) Validate the JWT using the user-context client.
    const authClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: claimsData, error: authError } = await authClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (authError || !userId) {
      return Response.json(
        { error: "Invalid session" },
        { status: 401, headers: corsHeaders },
      );
    }

    // 2) Read roles via service-role client (bypasses RLS, no persistent socket).
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await adminClient
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
