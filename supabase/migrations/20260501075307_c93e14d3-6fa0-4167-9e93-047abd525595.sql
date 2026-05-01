
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'it_admin'::app_role]));

CREATE POLICY "Authenticated insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id);
