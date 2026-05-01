import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Backend is not configured" }, 500);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Missing authorization" }, 401);

    let userId: string | undefined;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (!userErr && userData.user?.id) {
        userId = userData.user.id;
        break;
      }
      lastErr = userErr;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
    if (!userId) {
      console.error("getUser failed after retries", lastErr);
      return json({ error: "Invalid session" }, 401);
    }

    const { data: roles, error: rolesErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesErr) return json({ error: rolesErr.message }, 500);
    if (!roles?.some((r) => r.role === "vendor")) return json({ error: "Vendor access required" }, 403);

    if (req.method === "GET") {
      const { data, error } = await admin
        .from("quotations")
        .select("id, requirement_id, price, currency, notes, status, created_at, ho_requirements(title, title_ar)")
        .eq("vendor_id", userId)
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ quotations: data ?? [] });
    }

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({}));

    if (body.action === "document") {
      const quotationId = body.quotation_id;
      const fileName = typeof body.file_name === "string" ? body.file_name.trim() : "";
      const filePath = typeof body.file_path === "string" ? body.file_path.trim() : "";
      const mimeType = typeof body.mime_type === "string" ? body.mime_type.trim() : null;
      const sizeBytes = Number(body.size_bytes ?? 0);

      if (!isUuid(quotationId) || !fileName || !filePath || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
        return json({ error: "Invalid document details" }, 400);
      }
      if (!filePath.startsWith(`${userId}/${quotationId}/`)) return json({ error: "Invalid document path" }, 400);

      const { data: own, error: ownErr } = await admin
        .from("quotations")
        .select("id")
        .eq("id", quotationId)
        .eq("vendor_id", userId)
        .maybeSingle();
      if (ownErr) return json({ error: ownErr.message }, 500);
      if (!own) return json({ error: "Quotation not found" }, 404);

      const { error: insErr } = await admin.from("quotation_documents").insert({
        quotation_id: quotationId,
        file_name: fileName,
        file_path: filePath,
        mime_type: mimeType,
        size_bytes: sizeBytes,
      });
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ ok: true });
    }

    const requirementId = body.requirement_id;
    const price = Number(body.price);
    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    if (!isUuid(requirementId)) return json({ error: "Invalid tender" }, 400);
    if (!Number.isFinite(price) || price <= 0) return json({ error: "Enter a valid price" }, 400);
    if (notes && notes.length > 2000) return json({ error: "Notes are too long" }, 400);

    const { data: tender, error: tenderErr } = await admin
      .from("ho_requirements")
      .select("id, status")
      .eq("id", requirementId)
      .maybeSingle();
    if (tenderErr) return json({ error: tenderErr.message }, 500);
    if (!tender || tender.status !== "open") return json({ error: "Tender is not open" }, 400);

    const { data: inserted, error: insErr } = await admin
      .from("quotations")
      .insert({ requirement_id: requirementId, vendor_id: userId, price, notes })
      .select("id, requirement_id, price, currency, notes, status, created_at")
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, quotation: { ...inserted, ho_requirements: null } });
  } catch (error) {
    console.error("vendor-quotations failed", error);
    return json({ error: error instanceof Error ? error.message : "Unable to submit quotation" }, 500);
  }
});
