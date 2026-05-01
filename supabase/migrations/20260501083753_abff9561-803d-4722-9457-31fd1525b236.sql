-- Revoke public/authenticated EXECUTE on internal SECURITY DEFINER functions.
-- Policies still work because RLS evaluates policies as the postgres role.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[])   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.primary_role(uuid)               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_partner_rating()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                 FROM PUBLIC, anon, authenticated;