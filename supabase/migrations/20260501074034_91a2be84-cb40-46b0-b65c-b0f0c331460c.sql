CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.primary_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin'              THEN 1
    WHEN 'it_admin'           THEN 2
    WHEN 'hr_admin'           THEN 3
    WHEN 'procurement_admin'  THEN 4
    WHEN 'shareholder_admin'  THEN 5
    WHEN 'partner_admin'      THEN 6
    WHEN 'manager'            THEN 7
    WHEN 'employee'           THEN 8
    WHEN 'shareholder'        THEN 9
    WHEN 'partner'            THEN 10
    WHEN 'vendor'             THEN 11
    ELSE 99
  END
  LIMIT 1
$$;