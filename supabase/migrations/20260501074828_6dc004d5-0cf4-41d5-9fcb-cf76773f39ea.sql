-- ============ vendor_categories ============
CREATE TABLE public.vendor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_ar text,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly viewable"
  ON public.vendor_categories FOR SELECT
  TO public USING (true);

CREATE POLICY "Admins manage categories"
  ON public.vendor_categories FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]));

CREATE TRIGGER trg_vendor_categories_updated
  BEFORE UPDATE ON public.vendor_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ vendor_profiles ============
CREATE TABLE public.vendor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE,
  primary_category_id uuid REFERENCES public.vendor_categories(id) ON DELETE SET NULL,
  category_ids uuid[] NOT NULL DEFAULT '{}',
  commercial_register text,
  tax_number text,
  website text,
  description text,
  description_ar text,
  established_year integer,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  ratings_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vendor_profiles_vendor ON public.vendor_profiles(vendor_id);
CREATE INDEX idx_vendor_profiles_primary_cat ON public.vendor_profiles(primary_category_id);
CREATE INDEX idx_vendor_profiles_categories ON public.vendor_profiles USING GIN(category_ids);

ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own profile"
  ON public.vendor_profiles FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]));

CREATE POLICY "Vendors insert own profile"
  ON public.vendor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors update own profile"
  ON public.vendor_profiles FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]));

CREATE POLICY "Admins delete profiles"
  ON public.vendor_profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vendor_profiles_updated
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ vendor_ratings ============
CREATE TABLE public.vendor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL,
  rated_by uuid NOT NULL,
  quality smallint NOT NULL CHECK (quality BETWEEN 1 AND 5),
  price_score smallint NOT NULL CHECK (price_score BETWEEN 1 AND 5),
  delivery smallint NOT NULL CHECK (delivery BETWEEN 1 AND 5),
  communication smallint NOT NULL CHECK (communication BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vendor_ratings_vendor ON public.vendor_ratings(vendor_id);

ALTER TABLE public.vendor_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor or admins view ratings"
  ON public.vendor_ratings FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]));

CREATE POLICY "Admins create ratings"
  ON public.vendor_ratings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]) AND rated_by = auth.uid());

CREATE POLICY "Admins update ratings"
  ON public.vendor_ratings FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]));

CREATE POLICY "Admins delete ratings"
  ON public.vendor_ratings FOR DELETE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_admin']::app_role[]));

CREATE TRIGGER trg_vendor_ratings_updated
  BEFORE UPDATE ON public.vendor_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Recompute average rating ============
CREATE OR REPLACE FUNCTION public.recompute_vendor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v uuid;
  avg_score numeric(3,2);
  cnt integer;
BEGIN
  v := COALESCE(NEW.vendor_id, OLD.vendor_id);

  SELECT
    COALESCE(ROUND(AVG((quality + price_score + delivery + communication)::numeric / 4), 2), 0),
    COUNT(*)
  INTO avg_score, cnt
  FROM public.vendor_ratings
  WHERE vendor_id = v;

  -- Upsert into vendor_profiles (create a minimal row if it doesn't exist)
  INSERT INTO public.vendor_profiles (vendor_id, avg_rating, ratings_count)
  VALUES (v, avg_score, cnt)
  ON CONFLICT (vendor_id) DO UPDATE
    SET avg_rating = EXCLUDED.avg_rating,
        ratings_count = EXCLUDED.ratings_count,
        updated_at = now();

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recompute_vendor_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_ratings
  FOR EACH ROW EXECUTE FUNCTION public.recompute_vendor_rating();

-- ============ Link tenders to a category ============
ALTER TABLE public.ho_requirements
  ADD COLUMN category_id uuid REFERENCES public.vendor_categories(id) ON DELETE SET NULL;
CREATE INDEX idx_ho_requirements_category ON public.ho_requirements(category_id);

-- ============ Seed common categories ============
INSERT INTO public.vendor_categories (name, name_ar) VALUES
  ('Food & Beverages', 'الأغذية والمشروبات'),
  ('Cleaning Supplies', 'مواد التنظيف'),
  ('Maintenance', 'الصيانة'),
  ('IT & Equipment', 'تقنية المعلومات والأجهزة'),
  ('Office Supplies', 'القرطاسية'),
  ('Construction', 'الإنشاءات'),
  ('Logistics', 'الخدمات اللوجستية'),
  ('Marketing & Print', 'التسويق والطباعة')
ON CONFLICT (name) DO NOTHING;