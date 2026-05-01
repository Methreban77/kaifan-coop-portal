DROP POLICY IF EXISTS "Admins manage requests" ON public.partner_requests;

CREATE POLICY "Admins manage requests"
ON public.partner_requests
FOR ALL
TO authenticated
USING (
  public.has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::public.app_role,
      'procurement_admin'::public.app_role,
      'partner_admin'::public.app_role
    ]
  )
)
WITH CHECK (
  public.has_any_role(
    auth.uid(),
    ARRAY[
      'admin'::public.app_role,
      'procurement_admin'::public.app_role,
      'partner_admin'::public.app_role
    ]
  )
);