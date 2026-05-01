import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { isTransientDatabaseError, withSupabaseRetry } from "@/lib/supabaseRetry";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { partnerStatusLabel, type PartnerStatus } from "@/lib/partnerHelpers";

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Profile {
  id: string;
  partner_id: string;
  primary_category_id: string | null;
  category_ids: string[];
  commercial_register: string | null;
  tax_number: string | null;
  website: string | null;
  description: string | null;
  description_ar: string | null;
  established_year: number | null;
  contact_person: string | null;
  contact_mobile: string | null;
  services_provided: string | null;
  services_provided_ar: string | null;
  approval_status: PartnerStatus;
  suspension_reason: string | null;
}

interface CompanyDoc {
  name: string;
  path: string;
  size: number;
}

const schema = z.object({
  contact_person: z.string().trim().min(2).max(120),
  contact_mobile: z.string().trim().min(6).max(30),
  primary_category_id: z.string().uuid().nullable(),
  category_ids: z.array(z.string().uuid()).max(8),
  commercial_register: z.string().trim().max(100).nullable(),
  tax_number: z.string().trim().max(100).nullable(),
  website: z.string().trim().url().max(255).nullable().or(z.literal("").transform(() => null)),
  description: z.string().trim().max(1500).nullable(),
  description_ar: z.string().trim().max(1500).nullable(),
  services_provided: z.string().trim().max(1500).nullable(),
  services_provided_ar: z.string().trim().max(1500).nullable(),
  established_year: z.number().int().min(1900).max(new Date().getFullYear()).nullable(),
});

const DOC_TYPES = ["commercial_license", "authorized_signature", "tax_compliance", "company_profile"] as const;
type DocType = (typeof DOC_TYPES)[number];

const connectionMessage = (lang: "en" | "ar") =>
  lang === "ar"
    ? "تعذر الاتصال بقاعدة البيانات الآن. يرجى المحاولة مرة أخرى بعد لحظات."
    : "Could not reach the database right now. Please try again in a moment.";

const docTypeLabel = (t: DocType, lang: "en" | "ar") => {
  const m: Record<DocType, { en: string; ar: string }> = {
    commercial_license: { en: "Commercial License", ar: "الرخصة التجارية" },
    authorized_signature: { en: "Authorized Signature", ar: "التوقيع المعتمد" },
    tax_compliance: { en: "Tax / Compliance Documents", ar: "مستندات ضريبية / امتثال" },
    company_profile: { en: "Company Profile", ar: "ملف الشركة التعريفي" },
  };
  return lang === "ar" ? m[t].ar : m[t].en;
};

export function PartnerRegistrationForm() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<Record<DocType, CompanyDoc | null>>({
    commercial_license: null,
    authorized_signature: null,
    tax_compliance: null,
    company_profile: null,
  });
  const [form, setForm] = useState({
    contact_person: "",
    contact_mobile: "",
    primary_category_id: "",
    category_ids: [] as string[],
    commercial_register: "",
    tax_number: "",
    website: "",
    description: "",
    description_ar: "",
    services_provided: "",
    services_provided_ar: "",
    established_year: "",
  });

  useEffect(() => {
    if (!user) return;
    // Load profile first (critical for rendering form). Categories and docs load in background.
    (async () => {
      const prof = await withSupabaseRetry(() =>
        supabase.from("partner_profiles").select("*").eq("partner_id", user.id).maybeSingle(),
      );
      const p = prof.data as Profile | null;
      if (p) {
        setProfile(p);
        setForm({
          contact_person: p.contact_person ?? "",
          contact_mobile: p.contact_mobile ?? "",
          primary_category_id: p.primary_category_id ?? "",
          category_ids: p.category_ids ?? [],
          commercial_register: p.commercial_register ?? "",
          tax_number: p.tax_number ?? "",
          website: p.website ?? "",
          description: p.description ?? "",
          description_ar: p.description_ar ?? "",
          services_provided: p.services_provided ?? "",
          services_provided_ar: p.services_provided_ar ?? "",
          established_year: p.established_year ? String(p.established_year) : "",
        });
      }
      setLoading(false);
    })();

    // Background: categories
    (async () => {
      const cats = await withSupabaseRetry(() =>
        supabase.from("partner_categories").select("id,name,name_ar").eq("active", true).order("name"),
      );
      setCategories((cats.data as Category[]) ?? []);
      setCatsLoading(false);
    })();

    // Background: storage list of uploaded docs
    (async () => {
      const files = await supabase.storage.from("partner-documents").list(`${user.id}/company`, { limit: 100 });
      const d: Record<DocType, CompanyDoc | null> = {
        commercial_license: null,
        authorized_signature: null,
        tax_compliance: null,
        company_profile: null,
      };
      (files.data ?? []).forEach((f) => {
        for (const t of DOC_TYPES) {
          if (f.name.startsWith(`${t}_`)) {
            d[t] = { name: f.name, path: `${user.id}/company/${f.name}`, size: f.metadata?.size ?? 0 };
          }
        }
      });
      setDocs(d);
      setDocsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleCategory = (id: string) => {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(id) ? f.category_ids.filter((x) => x !== id) : [...f.category_ids, id],
    }));
  };

  const uploadDoc = async (type: DocType, file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) return toast.error(lang === "ar" ? "الملف أكبر من 10MB" : "File exceeds 10MB");
    // Remove previous file of this type
    const existing = docs[type];
    if (existing) await supabase.storage.from("partner-documents").remove([existing.path]);
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${user.id}/company/${type}_${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from("partner-documents").upload(path, file);
    if (error) return toast.error(error.message);
    setDocs((d) => ({ ...d, [type]: { name: file.name, path, size: file.size } }));
    toast.success(lang === "ar" ? "تم رفع المستند" : "Document uploaded");
  };

  const removeDoc = async (type: DocType) => {
    const existing = docs[type];
    if (!existing) return;
    await supabase.storage.from("partner-documents").remove([existing.path]);
    setDocs((d) => ({ ...d, [type]: null }));
  };

  const onSave = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      contact_person: form.contact_person,
      contact_mobile: form.contact_mobile,
      primary_category_id: form.primary_category_id || null,
      category_ids: form.category_ids,
      commercial_register: form.commercial_register || null,
      tax_number: form.tax_number || null,
      website: form.website || null,
      description: form.description || null,
      description_ar: form.description_ar || null,
      services_provided: form.services_provided || null,
      services_provided_ar: form.services_provided_ar || null,
      established_year: form.established_year ? Number(form.established_year) : null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    const payload = { partner_id: user.id, ...parsed.data };
    const { error } = profile
      ? await withSupabaseRetry(() => supabase.from("partner_profiles").update(payload).eq("partner_id", user.id))
      : await withSupabaseRetry(() => supabase.from("partner_profiles").insert(payload));
    setSaving(false);
    if (error) return toast.error(isTransientDatabaseError(error) ? connectionMessage(lang) : error.message);
    toast.success(lang === "ar" ? "تم حفظ بيانات الشركة" : "Company info saved");
    // Update local state from what we just saved — avoid an extra round-trip
    setProfile((prev) => ({
      ...(prev ?? {} as Profile),
      ...payload,
      approval_status: prev?.approval_status ?? "pending",
      suspension_reason: prev?.suspension_reason ?? null,
    } as Profile));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = profile?.approval_status ?? "pending";
  const statusBadge = (
    <Badge
      variant="outline"
      className={
        status === "active"
          ? "bg-success/15 text-success border-success/30"
          : status === "suspended" || status === "rejected"
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : "bg-accent/15 text-accent-foreground border-accent/30"
      }
    >
      {partnerStatusLabel(status, lang)}
    </Badge>
  );

  return (
    <div className="space-y-5">
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">
                {lang === "ar" ? "حالة التسجيل" : "Registration Status"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "يجب موافقة الإدارة على بياناتك لتتمكن من تقديم العروض"
                  : "Admin approval is required before you can submit proposals"}
              </CardDescription>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        {status === "suspended" && profile?.suspension_reason && (
          <CardContent>
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded p-3">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <div className="font-medium">{lang === "ar" ? "سبب الإيقاف:" : "Suspension reason:"}</div>
                <div>{profile.suspension_reason}</div>
              </div>
            </div>
          </CardContent>
        )}
        {status === "active" && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              {lang === "ar" ? "حسابك معتمد ويمكنك تقديم العروض." : "Your account is approved. You can submit proposals."}
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">{lang === "ar" ? "بيانات الشركة" : "Company Information"}</CardTitle>
          <CardDescription>
            {lang === "ar"
              ? "املأ كافة الحقول لاستكمال طلب التسجيل"
              : "Fill all fields to complete registration"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp">{lang === "ar" ? "الشخص المسؤول" : "Contact Person"} *</Label>
              <Input id="cp" value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm">{lang === "ar" ? "رقم الجوال" : "Mobile Number"} *</Label>
              <Input id="cm" type="tel" value={form.contact_mobile} onChange={(e) => setForm((f) => ({ ...f, contact_mobile: e.target.value }))} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "نوع النشاط الأساسي" : "Primary Category"}</Label>
              <Select value={form.primary_category_id || undefined} onValueChange={(v) => setForm((f) => ({ ...f, primary_category_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={lang === "ar" ? "اختر تصنيفاً" : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{(lang === "ar" && c.name_ar) || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">{lang === "ar" ? "سنة التأسيس" : "Established Year"}</Label>
              <Input id="year" type="number" value={form.established_year} onChange={(e) => setForm((f) => ({ ...f, established_year: e.target.value }))} placeholder="2010" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{lang === "ar" ? "تصنيفات إضافية" : "Additional Categories"}</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = form.category_ids.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/50 text-foreground/80 border-border hover:bg-secondary"
                    }`}
                  >
                    {(lang === "ar" && c.name_ar) || c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cr">{lang === "ar" ? "السجل التجاري" : "Commercial Register"}</Label>
              <Input id="cr" value={form.commercial_register} onChange={(e) => setForm((f) => ({ ...f, commercial_register: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax">{lang === "ar" ? "الرقم الضريبي" : "Tax Number"}</Label>
              <Input id="tax" value={form.tax_number} onChange={(e) => setForm((f) => ({ ...f, tax_number: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">{lang === "ar" ? "الموقع الإلكتروني" : "Website"}</Label>
            <Input id="website" type="url" placeholder="https://..." value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "الخدمات المقدمة (إنجليزي)" : "Services Provided (English)"}</Label>
              <Textarea rows={3} value={form.services_provided} onChange={(e) => setForm((f) => ({ ...f, services_provided: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "الخدمات المقدمة (عربي)" : "Services Provided (Arabic)"}</Label>
              <Textarea rows={3} value={form.services_provided_ar} onChange={(e) => setForm((f) => ({ ...f, services_provided_ar: e.target.value }))} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "نبذة عن الشركة (إنجليزي)" : "About Company (English)"}</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "نبذة عن الشركة (عربي)" : "About Company (Arabic)"}</Label>
              <Textarea rows={3} value={form.description_ar} onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">{lang === "ar" ? "المستندات المطلوبة" : "Required Documents"}</CardTitle>
          <CardDescription>
            {lang === "ar" ? "ارفع المستندات بصيغة PDF/JPG/PNG (حد أقصى 10MB)" : "Upload PDF/JPG/PNG (max 10MB each)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {DOC_TYPES.map((t) => {
            const d = docs[t];
            return (
              <div key={t} className="border border-border/60 rounded-md p-3">
                <div className="text-sm font-medium mb-2">{docTypeLabel(t, lang)}</div>
                {d ? (
                  <div className="flex items-center justify-between gap-2 bg-secondary/40 rounded px-2 py-1.5">
                    <span className="flex items-center gap-1.5 text-xs truncate"><FileText className="h-3.5 w-3.5" /> {d.name.replace(/^.*?_\d+_/, "")}</span>
                    <button onClick={() => removeDoc(t)} aria-label="remove" className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded p-3 cursor-pointer hover:bg-secondary/30 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{lang === "ar" ? "اختر ملف" : "Choose file"}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(t, e.target.files[0])} />
                  </label>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
