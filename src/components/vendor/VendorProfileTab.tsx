import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StarRating } from "./StarRating";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { z } from "zod";

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

interface VendorProfile {
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
  avg_rating: number;
  ratings_count: number;
  status: string;
}

const profileSchema = z.object({
  primary_category_id: z.string().uuid().nullable(),
  category_ids: z.array(z.string().uuid()).max(8),
  commercial_register: z.string().trim().max(100).nullable(),
  tax_number: z.string().trim().max(100).nullable(),
  website: z.string().trim().url().max(255).nullable().or(z.literal("").transform(() => null)),
  description: z.string().trim().max(1500).nullable(),
  description_ar: z.string().trim().max(1500).nullable(),
  established_year: z.number().int().min(1900).max(new Date().getFullYear()).nullable(),
});

export function VendorProfileTab() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [form, setForm] = useState({
    primary_category_id: "",
    category_ids: [] as string[],
    commercial_register: "",
    tax_number: "",
    website: "",
    description: "",
    description_ar: "",
    established_year: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [cats, prof] = await Promise.all([
        supabase.from("partner_categories").select("id,name,name_ar").eq("active", true).order("name"),
        supabase.from("partner_profiles").select("*").eq("partner_id", user.id).maybeSingle(),
      ]);
      setCategories((cats.data as Category[]) ?? []);
      const p = prof.data as VendorProfile | null;
      if (p) {
        setProfile(p);
        setForm({
          primary_category_id: p.primary_category_id ?? "",
          category_ids: p.category_ids ?? [],
          commercial_register: p.commercial_register ?? "",
          tax_number: p.tax_number ?? "",
          website: p.website ?? "",
          description: p.description ?? "",
          description_ar: p.description_ar ?? "",
          established_year: p.established_year ? String(p.established_year) : "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const toggleCategory = (id: string) => {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter((x) => x !== id)
        : [...f.category_ids, id],
    }));
  };

  const onSave = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse({
      primary_category_id: form.primary_category_id || null,
      category_ids: form.category_ids,
      commercial_register: form.commercial_register || null,
      tax_number: form.tax_number || null,
      website: form.website || null,
      description: form.description || null,
      description_ar: form.description_ar || null,
      established_year: form.established_year ? Number(form.established_year) : null,
    });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0].message);
    }
    setSaving(true);
    const payload = { partner_id: user.id, ...parsed.data };
    const { error } = profile
      ? await supabase.from("partner_profiles").update(payload).eq("partner_id", user.id)
      : await supabase.from("partner_profiles").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم حفظ الملف" : "Profile saved");
    const { data } = await supabase.from("partner_profiles").select("*").eq("partner_id", user.id).maybeSingle();
    if (data) setProfile(data as VendorProfile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">
            {lang === "ar" ? "أداء المورد" : "Vendor Performance"}
          </CardTitle>
          <CardDescription>
            {lang === "ar"
              ? "تقييمك حسب الإدارة بناءً على عقود سابقة"
              : "Your performance score based on past contracts"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-3xl font-bold text-primary">
              {(profile?.avg_rating ?? 0).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground"> / 5</span>
            </div>
            <StarRating value={profile?.avg_rating ?? 0} size="md" />
            <div className="text-xs text-muted-foreground mt-1">
              {profile?.ratings_count ?? 0} {lang === "ar" ? "تقييم" : "ratings"}
            </div>
          </div>
          <div className="flex-1" />
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            {lang === "ar" ? "نشط" : "Active"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">
            {lang === "ar" ? "ملف الشركة" : "Company Profile"}
          </CardTitle>
          <CardDescription>
            {lang === "ar"
              ? "هذه البيانات تُستخدم لمطابقتك مع المناقصات المناسبة"
              : "This information is used to match you to relevant tenders"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="primary_cat">
                {lang === "ar" ? "التصنيف الأساسي" : "Primary Category"}
              </Label>
              <Select
                value={form.primary_category_id || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, primary_category_id: v }))}
              >
                <SelectTrigger id="primary_cat">
                  <SelectValue placeholder={lang === "ar" ? "اختر تصنيفاً" : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(lang === "ar" && c.name_ar) || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">
                {lang === "ar" ? "سنة التأسيس" : "Established Year"}
              </Label>
              <Input
                id="year"
                type="number"
                value={form.established_year}
                onChange={(e) => setForm((f) => ({ ...f, established_year: e.target.value }))}
                placeholder="2010"
              />
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
              <Input
                id="cr"
                value={form.commercial_register}
                onChange={(e) => setForm((f) => ({ ...f, commercial_register: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax">{lang === "ar" ? "الرقم الضريبي" : "Tax Number"}</Label>
              <Input
                id="tax"
                value={form.tax_number}
                onChange={(e) => setForm((f) => ({ ...f, tax_number: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">{lang === "ar" ? "الموقع الإلكتروني" : "Website"}</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="desc">{lang === "ar" ? "وصف (إنجليزي)" : "Description (English)"}</Label>
              <Textarea
                id="desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc_ar">{lang === "ar" ? "وصف (عربي)" : "Description (Arabic)"}</Label>
              <Textarea
                id="desc_ar"
                rows={3}
                value={form.description_ar}
                onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
              />
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
    </div>
  );
}
