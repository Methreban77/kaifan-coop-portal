import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const adminRoles = ["admin", "procurement_admin"];
const statuses = new Set(["open", "closed"]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const databaseUrl = Deno.env.get("SUPABASE_DB_URL") ?? "";

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

async function getAuthorizedUserId(req: Request, db: Client) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!authHeader?.startsWith("Bearer ") || !token) return { error: json({ error: "Missing authorization" }, 401) };

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

type TenderPayload = {
  title?: string;
  title_ar?: string | null;
  description?: string;
  description_ar?: string | null;
  category_id?: string | null;
  category?: string | null;
  deadline?: string | null;
  status?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!databaseUrl || !supabaseUrl || !serviceRoleKey) return json({ error: "Backend is not configured" }, 500);

  const db = new Client(databaseUrl);

  try {
    await db.connect();
    const auth = await getAuthorizedUserId(req, db);
    if (auth.error) return auth.error;

    const body = (await req.json().catch(() => ({}))) as TenderPayload;
    const title = body.title?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    const status = body.status ?? "open";

    if (!title || !description) return json({ error: "Title and description are required" }, 400);
    if (!statuses.has(status)) return json({ error: "Invalid status" }, 400);

    const result = await db.queryObject<{ id: string }>(
      `insert into public.ho_requirements
       (title, title_ar, description, description_ar, category_id, category, deadline, status, created_by)
       values ($1, $2, $3, $4, $5::uuid, $6, $7::timestamptz, $8::public.requirement_status, $9::uuid)
       returning id`,
      [
        title,
        body.title_ar?.trim() || null,
        description,
        body.description_ar?.trim() || null,
        body.category_id || null,
        body.category?.trim() || null,
        body.deadline || null,
        status,
        auth.userId,
      ],
    );

    return json({ ok: true, id: result.rows[0]?.id });
  } catch (error) {
    console.error("admin-tenders failed", error);
    return json({ error: error instanceof Error ? error.message : "Unable to save tender" }, 500);
  } finally {
    try {
      await db.end();
    } catch (_) {
      // Ignore close errors.
    }
  }
});