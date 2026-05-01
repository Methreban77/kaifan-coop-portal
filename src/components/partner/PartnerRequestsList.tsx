import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { withSupabaseRetry } from "@/lib/supabaseRetry";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, AlertTriangle, Loader2 } from "lucide-react";
import { requestTypeLabel, type RequestType } from "@/lib/partnerHelpers";
import { ProposalDialog } from "./ProposalDialog";

interface PartnerRequest {
  id: string;
  request_type: RequestType;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  category_id: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  deadline: string | null;
  priority: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

export function PartnerRequestsList({ canSubmit, approvalLoading = false }: { canSubmit: boolean; approvalLoading?: boolean }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [reqs, setReqs] = useState<PartnerRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [myCategoryIds, setMyCategoryIds] = useState<string[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [active, setActive] = useState<PartnerRequest | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [r, c] = await Promise.all([
      withSupabaseRetry(() => supabase.from("partner_requests").select("*").eq("status", "open").order("deadline", { ascending: true, nullsFirst: false })),
      withSupabaseRetry(() => supabase.from("partner_categories").select("id,name,name_ar").eq("active", true).order("name")),
    ]);
    setReqs((r.data as any) ?? []);
    setCategories((c.data as Category[]) ?? []);
    setLoading(false);

    const [p, prop] = await Promise.all([
      withSupabaseRetry(() => supabase.from("partner_profiles").select("primary_category_id,category_ids").eq("partner_id", user.id).maybeSingle()),
      withSupabaseRetry(() => supabase.from("partner_proposals").select("request_id").eq("partner_id", user.id)),
    ]);
    const prof = p.data as { primary_category_id: string | null; category_ids: string[] } | null;
    const ids = new Set<string>();
    if (prof?.primary_category_id) ids.add(prof.primary_category_id);
    (prof?.category_ids ?? []).forEach((x) => ids.add(x));
    setMyCategoryIds(Array.from(ids));
    setSubmittedIds(new Set((prop.data ?? []).map((x: any) => x.request_id)));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const categoryName = (id: string | null) => {
    if (!id) return null;
    const c = categories.find((x) => x.id === id);
    return c ? (lang === "ar" && c.name_ar ? c.name_ar : c.name) : null;
  };

  const filtered = useMemo(() => {
    let out = reqs;
    if (filterType !== "all") out = out.filter((r) => r.request_type === filterType);
    if (filterCat === "mine") out = out.filter((r) => r.category_id && myCategoryIds.includes(r.category_id));
    else if (filterCat !== "all") out = out.filter((r) => r.category_id === filterCat);
    return out;
  }, [reqs, filterType, filterCat, myCategoryIds]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          {lang === "ar" ? "تصفية" : "Filter"}
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل الأنواع" : "All types"}</SelectItem>
            {(["tender","price_quotation","maintenance","service","project","contract_renewal","technical_evaluation","emergency"] as RequestType[]).map((t) => (
              <SelectItem key={t} value={t}>{requestTypeLabel(t, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل التصنيفات" : "All categories"}</SelectItem>
            <SelectItem value="mine" disabled={!myCategoryIds.length}>
              {lang === "ar" ? "مطابقة لتصنيفاتي" : "Matching my categories"}
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{(lang === "ar" && c.name_ar) || c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} {lang === "ar" ? "نتيجة" : "results"}</span>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          {lang === "ar" ? "لا توجد طلبات مفتوحة" : "No open requests"}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const submitted = submittedIds.has(r.id);
            return (
              <Card key={r.id} className="border-border/60 shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                      {requestTypeLabel(r.request_type, lang)}
                    </Badge>
                    {r.priority === "urgent" && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {lang === "ar" ? "عاجل" : "Urgent"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{(lang === "ar" && r.title_ar) || r.title}</CardTitle>
                  {categoryName(r.category_id) && <CardDescription>{categoryName(r.category_id)}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {(lang === "ar" && r.description_ar) || r.description}
                  </p>
                  {(r.budget_min || r.budget_max) && (
                    <div className="text-xs text-muted-foreground">
                      {lang === "ar" ? "الميزانية:" : "Budget:"} {r.budget_min?.toLocaleString() ?? "—"} - {r.budget_max?.toLocaleString() ?? "—"} {r.currency}
                    </div>
                  )}
                  {r.deadline && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {lang === "ar" ? "الموعد النهائي:" : "Deadline:"} {new Date(r.deadline).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")}
                    </div>
                  )}
                  <Button
                    onClick={() => setActive(r)}
                    disabled={submitted || approvalLoading || !canSubmit}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {submitted
                      ? (lang === "ar" ? "تم تقديم العرض" : "Proposal submitted")
                      : approvalLoading
                      ? (lang === "ar" ? "جارٍ التحقق..." : "Checking access...")
                      : !canSubmit
                      ? (lang === "ar" ? "بانتظار اعتماد الحساب" : "Awaiting account approval")
                      : (lang === "ar" ? "تقديم عرض" : "Submit Proposal")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProposalDialog request={active} onClose={() => { setActive(null); load(); }} />
    </div>
  );
}
