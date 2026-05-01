import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
};

const adminRoles = ["admin", "procurement_admin", "partner_admin", "it_admin"];
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const publishableKey =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function getAuthorizedUserId(req: Request, adminClient: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!authHeader?.startsWith("Bearer ") || !token) {
    return { error: Response.json({ error: "Missing authorization" }, { status: 401, headers: corsHeaders }) };
  }

  const authClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  let userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData.user?.id) {
      return { error: Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders }) };
    }
    userId = userData.user.id;
  }

  const { data: roles, error: rolesError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesError) {
    console.error("admin-partners: roles query failed", rolesError);
    return { error: Response.json({ error: "Unable to verify admin access" }, { status: 503, headers: corsHeaders }) };
  }

  const isAdmin = (roles ?? []).some((row: { role: string }) => adminRoles.includes(row.role));
  if (!isAdmin) {
    return { error: Response.json({ error: "Admin access required" }, { status: 403, headers: corsHeaders }) };
  }

  return { userId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const auth = await getAuthorizedUserId(req, adminClient);
    if (auth.error) return auth.error;

    if (req.method === "PATCH") {
      const body = await req.json().catch(() => ({}));
      const partnerId = body.partnerId as string | undefined;
      const status = body.status as string | undefined;
      const reason = (body.reason as string | undefined) ?? null;

      if (!partnerId || !["pending", "active", "suspended", "rejected"].includes(status ?? "")) {
        return Response.json({ error: "Invalid partner status update" }, { status: 400, headers: corsHeaders });
      }

      const payload: Record<string, unknown> = { approval_status: status };
      if (status === "active") {
        payload.approved_at = new Date().toISOString();
        payload.approved_by = auth.userId;
        payload.suspension_reason = null;
      }
      if (status === "suspended") payload.suspension_reason = reason;

      const { error: updateError } = await adminClient
        .from("partner_profiles")
        .update(payload)
        .eq("partner_id", partnerId);

      if (updateError) {
        console.error("admin-partners: update failed", updateError);
        return Response.json({ error: updateError.message }, { status: 503, headers: corsHeaders });
      }

      await adminClient.from("notifications").insert({
        user_id: partnerId,
        title: "Account status updated",
        message: `Your account status is now: ${status}${reason ? ` — ${reason}` : ""}`,
      });

      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (req.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
    }

    const { data: partners, error: partnersError } = await adminClient
      .from("partner_profiles")
      .select("partner_id, avg_rating, ratings_count, approval_status, primary_category_id, contact_person, contact_mobile")
      .order("approval_status", { ascending: true });

    if (partnersError) {
      console.error("admin-partners: partners query failed", partnersError);
      return Response.json({ error: partnersError.message }, { status: 503, headers: corsHeaders });
    }

    const ids = (partners ?? []).map((partner: { partner_id: string }) => partner.partner_id);
    const [{ data: profiles, error: profilesError }, { data: categories, error: categoriesError }] = await Promise.all([
      ids.length
        ? adminClient.from("profiles").select("id, email, company_name").in("id", ids)
        : Promise.resolve({ data: [], error: null }),
      adminClient.from("partner_categories").select("id, name, name_ar"),
    ]);

    if (profilesError || categoriesError) {
      console.error("admin-partners: lookup query failed", profilesError ?? categoriesError);
      return Response.json({ error: "Unable to load partner details" }, { status: 503, headers: corsHeaders });
    }

    return Response.json({ partners: partners ?? [], profiles: profiles ?? [], categories: categories ?? [] }, { headers: corsHeaders });
  } catch (error) {
    console.error("admin-partners function failed", error);
    return Response.json({ error: "Unable to load partners" }, { status: 500, headers: corsHeaders });
  }
});
