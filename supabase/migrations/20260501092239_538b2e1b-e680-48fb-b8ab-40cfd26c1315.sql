CREATE POLICY "Admins can view profiles for partner management"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::public.app_role,
      'procurement_admin'::public.app_role,
      'partner_admin'::public.app_role,
      'it_admin'::public.app_role
    ]
  )
);