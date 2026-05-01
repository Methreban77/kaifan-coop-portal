-- ============================================================
-- 1) NEW ENUMS
-- ============================================================
CREATE TYPE public.partner_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE public.request_type AS ENUM (
  'tender','price_quotation','maintenance','service','project',
  'contract_renewal','technical_evaluation','emergency'
);
CREATE TYPE public.proposal_status AS ENUM (
  'submitted','under_review','technical_eval','financial_eval','approved','rejected','awarded'
);
CREATE TYPE public.contract_status AS ENUM ('draft','active','expired','terminated','renewed');

-- ============================================================
-- 2) RENAME EXISTING TABLES (vendor_* -> partner_*)
-- ============================================================
ALTER TABLE public.vendor_profiles    RENAME TO partner_profiles;
ALTER TABLE public.vendor_categories  RENAME TO partner_categories;
ALTER TABLE public.vendor_ratings     RENAME TO partner_ratings;

-- Rename vendor_id columns to partner_id
ALTER TABLE public.partner_profiles RENAME COLUMN vendor_id TO partner_id;
ALTER TABLE public.partner_ratings  RENAME COLUMN vendor_id TO partner_id;

-- ============================================================
-- 3) EXTEND partner_profiles WITH NEW FIELDS
-- ============================================================
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS contact_person     text,
  ADD COLUMN IF NOT EXISTS contact_mobile     text,
  ADD COLUMN IF NOT EXISTS services_provided  text,
  ADD COLUMN IF NOT EXISTS services_provided_ar text,
  ADD COLUMN IF NOT EXISTS approval_status    partner_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at        timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by        uuid,
  ADD COLUMN IF NOT EXISTS suspension_reason  text;

-- Extend ratings with new evaluation criteria
ALTER TABLE public.partner_ratings
  ADD COLUMN IF NOT EXISTS response_time     smallint,
  ADD COLUMN IF NOT EXISTS deadline_commit   smallint,
  ADD COLUMN IF NOT EXISTS technical_capab   smallint,
  ADD COLUMN IF NOT EXISTS requirement_compliance smallint;

-- ============================================================
-- 4) UPDATE EXISTING POLICIES (rename references)
-- ============================================================
-- partner_profiles
DROP POLICY IF EXISTS "Vendors view own profile"   ON public.partner_profiles;
DROP POLICY IF EXISTS "Vendors update own profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Vendors insert own profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Admins delete profiles"     ON public.partner_profiles;

CREATE POLICY "Partners view own profile" ON public.partner_profiles
  FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

CREATE POLICY "Partners insert own profile" ON public.partner_profiles
  FOR INSERT TO authenticated
  WITH CHECK (partner_id = auth.uid() AND has_role(auth.uid(),'vendor'::app_role));

CREATE POLICY "Partners update own profile" ON public.partner_profiles
  FOR UPDATE TO authenticated
  USING (partner_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

CREATE POLICY "Admins delete profiles" ON public.partner_profiles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- partner_ratings
DROP POLICY IF EXISTS "Vendor or admins view ratings" ON public.partner_ratings;
CREATE POLICY "Partner or admins view ratings" ON public.partner_ratings
  FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

-- ============================================================
-- 5) UPDATE recompute_vendor_rating -> recompute_partner_rating
-- ============================================================
DROP TRIGGER IF EXISTS trg_recompute_vendor_rating ON public.partner_ratings;
DROP FUNCTION IF EXISTS public.recompute_vendor_rating();

CREATE OR REPLACE FUNCTION public.recompute_partner_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v uuid;
  avg_score numeric(3,2);
  cnt integer;
BEGIN
  v := COALESCE(NEW.partner_id, OLD.partner_id);
  SELECT
    COALESCE(ROUND(AVG((quality + price_score + delivery + communication
                        + COALESCE(response_time,0) + COALESCE(deadline_commit,0)
                        + COALESCE(technical_capab,0) + COALESCE(requirement_compliance,0)
                       )::numeric / NULLIF(
                         4 + (CASE WHEN response_time IS NULL THEN 0 ELSE 1 END)
                           + (CASE WHEN deadline_commit IS NULL THEN 0 ELSE 1 END)
                           + (CASE WHEN technical_capab IS NULL THEN 0 ELSE 1 END)
                           + (CASE WHEN requirement_compliance IS NULL THEN 0 ELSE 1 END)
                         ,0)
                       ), 2), 0),
    COUNT(*)
  INTO avg_score, cnt
  FROM public.partner_ratings
  WHERE partner_id = v;

  INSERT INTO public.partner_profiles (partner_id, avg_rating, ratings_count)
  VALUES (v, avg_score, cnt)
  ON CONFLICT (partner_id) DO UPDATE
    SET avg_rating = EXCLUDED.avg_rating,
        ratings_count = EXCLUDED.ratings_count,
        updated_at = now();
  RETURN NULL;
END;
$function$;

CREATE TRIGGER trg_recompute_partner_rating
AFTER INSERT OR UPDATE OR DELETE ON public.partner_ratings
FOR EACH ROW EXECUTE FUNCTION public.recompute_partner_rating();

-- ============================================================
-- 6) NEW TABLE: partner_requests (multi-type requests)
-- ============================================================
CREATE TABLE public.partner_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type request_type NOT NULL DEFAULT 'price_quotation',
  title text NOT NULL,
  title_ar text,
  description text NOT NULL,
  description_ar text,
  category_id uuid REFERENCES public.partner_categories(id) ON DELETE SET NULL,
  budget_min numeric,
  budget_max numeric,
  currency text NOT NULL DEFAULT 'KWD',
  deadline timestamptz,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  created_by uuid,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requests publicly viewable" ON public.partner_requests
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage requests" ON public.partner_requests
  FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

CREATE TRIGGER trg_partner_requests_updated
BEFORE UPDATE ON public.partner_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_partner_requests_status ON public.partner_requests(status);
CREATE INDEX idx_partner_requests_category ON public.partner_requests(category_id);
CREATE INDEX idx_partner_requests_type ON public.partner_requests(request_type);

-- ============================================================
-- 7) NEW TABLE: partner_proposals (technical + financial offers)
-- ============================================================
CREATE TABLE public.partner_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.partner_requests(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  financial_offer numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KWD',
  technical_offer text,
  delivery_period_days integer,
  warranty_period_months integer,
  sla text,
  notes text,
  exceptions text,
  status proposal_status NOT NULL DEFAULT 'submitted',
  technical_score numeric(5,2),
  financial_score numeric(5,2),
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own proposals" ON public.partner_proposals
  FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

CREATE POLICY "Partners insert own proposals" ON public.partner_proposals
  FOR INSERT TO authenticated
  WITH CHECK (partner_id = auth.uid() AND has_role(auth.uid(),'vendor'::app_role));

CREATE POLICY "Partners update own submitted proposals" ON public.partner_proposals
  FOR UPDATE TO authenticated
  USING (partner_id = auth.uid() AND status = 'submitted');

CREATE POLICY "Admins manage all proposals" ON public.partner_proposals
  FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

CREATE TRIGGER trg_partner_proposals_updated
BEFORE UPDATE ON public.partner_proposals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_partner_proposals_request ON public.partner_proposals(request_id);
CREATE INDEX idx_partner_proposals_partner ON public.partner_proposals(partner_id);

-- ============================================================
-- 8) NEW TABLE: partner_proposal_documents
-- ============================================================
CREATE TABLE public.partner_proposal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.partner_proposals(id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'attachment', -- technical | financial | attachment
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_proposal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own proposal docs" ON public.partner_proposal_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_proposals p
                  WHERE p.id = proposal_id
                    AND (p.partner_id = auth.uid()
                         OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]))));

CREATE POLICY "Partners insert own proposal docs" ON public.partner_proposal_documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.partner_proposals p
                       WHERE p.id = proposal_id AND p.partner_id = auth.uid()));

CREATE POLICY "Partners delete own proposal docs" ON public.partner_proposal_documents
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_proposals p
                  WHERE p.id = proposal_id AND p.partner_id = auth.uid()));

-- ============================================================
-- 9) NEW TABLE: partner_contracts
-- ============================================================
CREATE TABLE public.partner_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL UNIQUE,
  partner_id uuid NOT NULL,
  proposal_id uuid REFERENCES public.partner_proposals(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.partner_requests(id) ON DELETE SET NULL,
  title text NOT NULL,
  title_ar text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  renewal_notice_days integer DEFAULT 30,
  contract_value numeric,
  currency text DEFAULT 'KWD',
  responsible_department text,
  contract_file_path text,
  status contract_status NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own contracts" ON public.partner_contracts
  FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

CREATE POLICY "Admins manage contracts" ON public.partner_contracts
  FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]));

CREATE TRIGGER trg_partner_contracts_updated
BEFORE UPDATE ON public.partner_contracts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_partner_contracts_partner ON public.partner_contracts(partner_id);
CREATE INDEX idx_partner_contracts_end_date ON public.partner_contracts(end_date);

-- ============================================================
-- 10) NEW TABLE: partner_review_history (audit trail of workflow)
-- ============================================================
CREATE TABLE public.partner_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.partner_proposals(id) ON DELETE CASCADE,
  from_status proposal_status,
  to_status proposal_status NOT NULL,
  actor_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_review_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own review history" ON public.partner_review_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_proposals p
                  WHERE p.id = proposal_id
                    AND (p.partner_id = auth.uid()
                         OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]))));

CREATE POLICY "Admins insert review history" ON public.partner_review_history
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role]) AND actor_id = auth.uid());

-- ============================================================
-- 11) STORAGE BUCKET: partner-documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Partners view own files in partner-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'procurement_admin'::app_role])
  )
);

CREATE POLICY "Partners upload own files in partner-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'partner-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Partners update own files in partner-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Partners delete own files in partner-documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(),'admin'::app_role)
  )
);

-- ============================================================
-- 12) SEED 10 DEFAULT PARTNER CATEGORIES (only if missing)
-- ============================================================
INSERT INTO public.partner_categories (name, name_ar, description, active)
SELECT * FROM (VALUES
  ('IT Companies',                  'شركات تقنية المعلومات',  'Information technology services', true),
  ('Maintenance Companies',         'شركات الصيانة',          'Facility & equipment maintenance', true),
  ('Construction Companies',        'شركات المقاولات',        'Construction & civil works', true),
  ('Marketing & Media',             'التسويق والإعلام',       'Marketing, advertising & media', true),
  ('Delivery Companies',            'شركات التوصيل',          'Logistics & delivery', true),
  ('Security Companies',            'شركات الأمن والحراسة',   'Security services', true),
  ('Cleaning Companies',            'شركات النظافة',          'Cleaning & sanitation', true),
  ('Consulting Companies',          'شركات الاستشارات',       'Business & technical consulting', true),
  ('Equipment Suppliers',           'موردو المعدات',          'Equipment & hardware suppliers', true),
  ('Software Providers',            'موفرو البرمجيات',        'Software products & licenses', true)
) AS v(name, name_ar, description, active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.partner_categories pc WHERE pc.name = v.name
);