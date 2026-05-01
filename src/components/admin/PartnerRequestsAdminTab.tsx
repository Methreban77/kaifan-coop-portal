import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { REQUEST_TYPES, requestTypeLabel, type RequestType } from "@/lib/partnerHelpers";
import { withSupabaseRetry } from "@/lib/supabaseRetry";

interface Category { id: string; name: string; name_ar: string | null; }
interface Req {
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

const empty = () => ({
  id: "",
  request_type: "price_quotation" as RequestType,
  title: "", title_ar: "",
  description: "", description_ar: "",
  category_id: "",
  budget_min: "", budget_max: "",
  currency: "KWD",
  deadline: "",
  priority: "normal",
  status: "open",
});

export function PartnerRequestsAdminTab() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [items, setItems] = useState<Req[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const r = await withSupabaseRetry(() => supabase.from("partner_requests").select("*").order("created_at", { ascending: false }));
    const c = await withSupabaseRetry(() => supabase.from("partner_categories").select("id,name,name_ar").eq("active", true).order("name"));
    setItems((r.data as any) ?? []);
    setCats((c.data as Category[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(empty()); setOpen(true); };
  const startEdit = (r: Req) => {
    setForm({
      id: r.id,
      request_type: r.request_type,
      title: r.title, title_ar: r.title_ar ?? "",
      description: r.description, description_ar: r.description_ar ?? "",
      category_id: r.category_id ?? "",
      budget_min: r.budget_min != null ? String(r.budget_min) : "",
      budget_max: r.budget_max != null ? String(r.budget_max) : "",
      currency: r.currency,
      deadline: r.deadline ? r.deadline.slice(0, 16) : "",
      priority: r.priority,
      status: r.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error(lang === "ar" ? "العنوان والوصف مطلوبان" : "Title and description required");
    setSaving(true);
    const session = await supabase.auth.getSession();
    const payload = {
      request_type: form.request_type,
      title: form.title.trim(),
      title_ar: form.title_ar.trim() || null,
      description: form.description.trim(),
      description_ar: form.description_ar.trim() || null,
      category_id: form.category_id || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      currency: form.currency,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      priority: form.priority,
      status: form.status,
    };
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-partner-requests`, {
      method: form.id ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${session.data.session?.access_token ?? ""}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form.id ? { ...payload, id: form.id } : payload),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return toast.error(result.error ?? (lang === "ar" ? "تعذر الحفظ" : "Unable to save"));
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(lang === "ar" ? "حذف هذا الطلب؟" : "Delete this request?")) return;
    const session = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-partner-requests`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.data.session?.access_token ?? ""}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(result.error ?? (lang === "ar" ? "تعذر الحذف" : "Unable to delete"));
    toast.success(lang === "ar" ? "تم الحذف" : "Deleted");
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{lang === "ar" ? "إدارة الطلبات" : "Requests Management"}</CardTitle>
        <Button onClick={startNew} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{lang === "ar" ? "طلب جديد" : "New Request"}</Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">{lang === "ar" ? "لا توجد طلبات" : "No requests"}</div>
        ) : (
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 border border-border/60 rounded-md p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{requestTypeLabel(r.request_type, lang)}</Badge>
                    <Badge variant={r.status === "open" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                    {r.priority === "urgent" && <Badge variant="destructive" className="text-xs">{lang === "ar" ? "عاجل" : "Urgent"}</Badge>}
                  </div>
                  <div className="font-medium truncate">{(lang === "ar" && r.title_ar) || r.title}</div>
                  {r.deadline && <div className="text-xs text-muted-foreground">{new Date(r.deadline).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")}</div>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(r)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? (lang === "ar" ? "تعديل طلب" : "Edit Request") : (lang === "ar" ? "طلب جديد" : "New Request")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "نوع الطلب" : "Request Type"}</Label>
                <Select value={form.request_type} onValueChange={(v) => setForm((f) => ({ ...f, request_type: v as RequestType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => <SelectItem key={t} value={t}>{requestTypeLabel(t, lang)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الفئة" : "Category"}</Label>
                <Select value={form.category_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{lang === "ar" ? "بدون" : "None"}</SelectItem>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{(lang === "ar" && c.name_ar) || c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الوصف (إنجليزي)" : "Description (English)"} *</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea rows={3} value={form.description_ar} onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الحد الأدنى" : "Budget Min"}</Label>
                <Input type="number" value={form.budget_min} onChange={(e) => setForm((f) => ({ ...f, budget_min: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الحد الأقصى" : "Budget Max"}</Label>
                <Input type="number" value={form.budget_max} onChange={(e) => setForm((f) => ({ ...f, budget_max: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "العملة" : "Currency"}</Label>
                <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الموعد النهائي" : "Deadline"}</Label>
                <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الأولوية" : "Priority"}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{lang === "ar" ? "عادي" : "Normal"}</SelectItem>
                    <SelectItem value="high">{lang === "ar" ? "مرتفع" : "High"}</SelectItem>
                    <SelectItem value="urgent">{lang === "ar" ? "عاجل" : "Urgent"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{lang === "ar" ? "مفتوح" : "Open"}</SelectItem>
                    <SelectItem value="closed">{lang === "ar" ? "مغلق" : "Closed"}</SelectItem>
                    <SelectItem value="archived">{lang === "ar" ? "مؤرشف" : "Archived"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save} disabled={saving}>{saving ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ" : "Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
