import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, PATCH, DELETE, OPTIONS",
};

const adminRoles = ["admin", "procurement_admin", "partner_admin"];
const requestTypes = new Set(["tender", "price_quotation", "maintenance", "service", "project", "contract_renewal", "technical_evaluation", "emergency"]);
const priorities = new Set(["normal", "high", "urgent"]);
const statuses = new Set(["open", "closed", "archived"]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const databaseUrl = Deno.env.get("SUPABASE_DB_URL") ?? "";

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function authToken(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  return authHeader?.startsWith("Bearer ") && token ? token : null;
}

async function getAuthorizedUserId(req: Request, db: Client) {
  const token = authToken(req);
  if (!token) return { error: json({ error: "Missing authorization" }, 401) };

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data.user?.id) return { error: json({ error: "Invalid session" }, 401) };

  const roles = await db.queryObject<{ role: string }>(
    "select role::text as role from public.user_roles where user_id = $1::uuid",
    [data.user.id],
  );
  const isAdmin = roles.rows.some((row) => adminRoles.includes(row.role));
  if (!isAdmin) return { error: json({ error: "Admin access required" }, 403) };

  return { userId: data.user.id };
}

type RequestPayload = {
  request_type?: string;
  title?: string;
  title_ar?: string | null;
  description?: string;
  description_ar?: string | null;
  category_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  currency?: string;
  deadline?: string | null;
  priority?: string;
  status?: string;
};

function cleanPayload(body: RequestPayload) {
  const requestType = body.request_type ?? "price_quotation";
  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const priority = body.priority ?? "normal";
  const status = body.status ?? "open";

  if (!requestTypes.has(requestType)) return { error: "Invalid request type" };
  if (!title || !description) return { error: "Title and description required" };
  if (!priorities.has(priority)) return { error: "Invalid priority" };
  if (!statuses.has(status)) return { error: "Invalid status" };

  return {
    payload: {
      requestType,
      title,
      titleAr: body.title_ar?.trim() || null,
      description,
      descriptionAr: body.description_ar?.trim() || null,
      categoryId: body.category_id || null,
      budgetMin: body.budget_min ?? null,
      budgetMax: body.budget_max ?? null,
      currency: body.currency?.trim() || "KWD",
      deadline: body.deadline || null,
      priority,
      status,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!databaseUrl || !supabaseUrl || !serviceRoleKey) return json({ error: "Backend is not configured" }, 500);

  const db = new Client(databaseUrl);

  try {
    await db.connect();
    const auth = await getAuthorizedUserId(req, db);
    if (auth.error) return auth.error;

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => ({}));
      const id = body.id as string | undefined;
      if (!id) return json({ error: "Missing request id" }, 400);

      await db.queryObject("delete from public.partner_requests where id = $1::uuid", [id]);
      return json({ ok: true });
    }

    if (req.method !== "POST" && req.method !== "PATCH") {
      return json({ error: "Method not allowed" }, 405);
    }

    const body = await req.json().catch(() => ({}));
    const cleaned = cleanPayload(body);
    if (cleaned.error || !cleaned.payload) return json({ error: cleaned.error }, 400);
    const p = cleaned.payload;

    if (req.method === "PATCH") {
      const id = body.id as string | undefined;
      if (!id) return json({ error: "Missing request id" }, 400);

      const result = await db.queryObject<{ id: string }>(
        `update public.partner_requests
         set request_type = $1::public.request_type,
             title = $2,
             title_ar = $3,
             description = $4,
             description_ar = $5,
             category_id = $6::uuid,
             budget_min = $7,
             budget_max = $8,
             currency = $9,
             deadline = $10::timestamptz,
             priority = $11,
             status = $12,
             updated_at = now()
         where id = $13::uuid
         returning id`,
        [p.requestType, p.title, p.titleAr, p.description, p.descriptionAr, p.categoryId, p.budgetMin, p.budgetMax, p.currency, p.deadline, p.priority, p.status, id],
      );
      return json({ ok: true, id: result.rows[0]?.id ?? id });
    }

    const result = await db.queryObject<{ id: string }>(
      `insert into public.partner_requests
       (request_type, title, title_ar, description, description_ar, category_id, budget_min, budget_max, currency, deadline, priority, status, created_by)
       values ($1::public.request_type, $2, $3, $4, $5, $6::uuid, $7, $8, $9, $10::timestamptz, $11, $12, $13::uuid)
       returning id`,
      [p.requestType, p.title, p.titleAr, p.description, p.descriptionAr, p.categoryId, p.budgetMin, p.budgetMax, p.currency, p.deadline, p.priority, p.status, auth.userId],
    );

    return json({ ok: true, id: result.rows[0]?.id });
  } catch (error) {
    console.error("admin-partner-requests failed", error);
    return json({ error: error instanceof Error ? error.message : "Unable to save request" }, 500);
  } finally {
    try {
      await db.end();
    } catch (_) {
      // Ignore close errors.
    }
  }
});
