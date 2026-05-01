import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { withSupabaseRetry } from "@/lib/supabaseRetry";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { format } from "date-fns";

type Row = {
  id: string;
  title: string;
  title_ar: string | null;
  status: string;
  category: string | null;
  deadline: string | null;
  quote_count: number;
};

export function TendersAdminTab() {
  const { lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string; name_ar: string | null }[]>([]);

  const [form, setForm] = useState({
    title: "",
    title_ar: "",
    description: "",
    description_ar: "",
    category_id: "",
    deadline: "",
    status: "open",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partner_categories")
        .select("id, name, name_ar")
        .eq("active", true)
        .order("name");
      setCategories(data ?? []);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: reqs, error: reqsError } = await withSupabaseRetry(() =>
      supabase
        .from("ho_requirements")
        .select("id, title, title_ar, status, category, deadline")
        .order("created_at", { ascending: false })
        .limit(100),
    );

    if (reqsError) {
      toast.error(reqsError.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const ids = (reqs ?? []).map((r) => r.id);
    setRows(
      (reqs ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        title_ar: r.title_ar,
        status: r.status,
        category: r.category,
        deadline: r.deadline,
        quote_count: 0,
      })),
    );
    setLoading(false);

    if (!ids.length) return;

    const { data: quotes, error: quotesError } = await withSupabaseRetry(() =>
      supabase
        .from("quotations")
        .select("requirement_id")
        .in("requirement_id", ids),
      2,
    );

    if (quotesError) return;

    const counts = new Map<string, number>();
    (quotes ?? []).forEach((q) => counts.set(q.requirement_id, (counts.get(q.requirement_id) ?? 0) + 1));
    setRows((current) => current.map((row) => ({ ...row, quote_count: counts.get(row.id) ?? 0 })));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(lang === "ar" ? "العنوان والوصف مطلوبان" : "Title and description are required");
      return;
    }
    setSaving(true);
    const selectedCat = categories.find((c) => c.id === form.category_id);
    const session = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-tenders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.data.session?.access_token ?? ""}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: form.title.trim(),
        title_ar: form.title_ar.trim() || null,
        description: form.description.trim(),
        description_ar: form.description_ar.trim() || null,
        category_id: form.category_id || null,
        category: selectedCat?.name ?? null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        status: form.status as "open" | "closed",
      }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(result.error ?? (lang === "ar" ? "تعذر إضافة المناقصة" : "Unable to create tender"));
      return;
    }
    toast.success(lang === "ar" ? "تمت إضافة المناقصة" : "Tender created");
    setOpen(false);
    setForm({ title: "", title_ar: "", description: "", description_ar: "", category_id: "", deadline: "", status: "open" });
    load();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{lang === "ar" ? "المناقصات" : "Tenders"}</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{lang === "ar" ? "مناقصة جديدة" : "New Tender"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lang === "ar" ? "إضافة مناقصة" : "Add Tender"}</DialogTitle>
                <DialogDescription>
                  {lang === "ar" ? "أدخل تفاصيل طلب المكتب الرئيسي." : "Enter the head office request details."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{lang === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>{lang === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                    <Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>{lang === "ar" ? "الوصف (إنجليزي)" : "Description (English)"} *</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>{lang === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                  <Textarea rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>{lang === "ar" ? "الفئة" : "Category"}</Label>
                    <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر فئة" : "Select category"} /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {lang === "ar" ? (c.name_ar ?? c.name) : c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{lang === "ar" ? "الموعد النهائي" : "Deadline"}</Label>
                    <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                  <div>
                    <Label>{lang === "ar" ? "الحالة" : "Status"}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">{lang === "ar" ? "مفتوحة" : "Open"}</SelectItem>
                        <SelectItem value="closed">{lang === "ar" ? "مغلقة" : "Closed"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ" : "Save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang === "ar" ? "العنوان" : "Title"}</TableHead>
              <TableHead>{lang === "ar" ? "الفئة" : "Category"}</TableHead>
              <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead>{lang === "ar" ? "العروض" : "Quotes"}</TableHead>
              <TableHead>{lang === "ar" ? "الموعد النهائي" : "Deadline"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                {lang === "ar" ? "لا توجد مناقصات" : "No tenders"}
              </TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{lang === "ar" ? (r.title_ar ?? r.title) : r.title}</TableCell>
                  <TableCell>{r.category || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "open" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>{r.quote_count}</TableCell>
                  <TableCell>{r.deadline ? format(new Date(r.deadline), "yyyy-MM-dd") : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
