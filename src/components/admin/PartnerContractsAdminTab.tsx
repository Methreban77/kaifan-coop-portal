import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Bell, Upload } from "lucide-react";
import { CONTRACT_STATUSES, contractStatusLabel, daysUntil, type ContractStatus } from "@/lib/partnerHelpers";

interface Contract {
  id: string;
  contract_number: string;
  partner_id: string;
  title: string;
  title_ar: string | null;
  start_date: string;
  end_date: string;
  renewal_notice_days: number | null;
  contract_value: number | null;
  currency: string | null;
  responsible_department: string | null;
  status: ContractStatus;
  notes: string | null;
  contract_file_path: string | null;
  profiles?: { company_name: string | null; email: string | null } | null;
}

const empty = () => ({
  id: "",
  contract_number: "",
  partner_id: "",
  title: "", title_ar: "",
  start_date: "",
  end_date: "",
  renewal_notice_days: "30",
  contract_value: "",
  currency: "KWD",
  responsible_department: "",
  status: "active" as ContractStatus,
  notes: "",
});

export function PartnerContractsAdminTab() {
  const { lang } = useI18n();
  const [items, setItems] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty());
  const [contractFile, setContractFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await supabase.from("partner_contracts").select("*").order("end_date", { ascending: true });
    const list = (data as any[]) ?? [];
    const ids = Array.from(new Set(list.map((c) => c.partner_id)));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, company_name, email").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    setItems(list.map((c) => ({ ...c, profiles: map.get(c.partner_id) ?? null })));

    const { data: allPartners } = await supabase.from("partner_profiles").select("partner_id").eq("approval_status", "active");
    const partnerIds = (allPartners ?? []).map((p: any) => p.partner_id);
    const { data: prof } = partnerIds.length
      ? await supabase.from("profiles").select("id, company_name, email").in("id", partnerIds)
      : { data: [] as any[] };
    setPartners((prof ?? []).map((p: any) => ({ id: p.id, name: p.company_name || p.email || p.id.slice(0, 8) })));
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(empty()); setContractFile(null); setOpen(true); };
  const startEdit = (c: Contract) => {
    setForm({
      id: c.id,
      contract_number: c.contract_number,
      partner_id: c.partner_id,
      title: c.title, title_ar: c.title_ar ?? "",
      start_date: c.start_date,
      end_date: c.end_date,
      renewal_notice_days: c.renewal_notice_days != null ? String(c.renewal_notice_days) : "30",
      contract_value: c.contract_value != null ? String(c.contract_value) : "",
      currency: c.currency ?? "KWD",
      responsible_department: c.responsible_department ?? "",
      status: c.status,
      notes: c.notes ?? "",
    });
    setContractFile(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.contract_number || !form.partner_id || !form.title || !form.start_date || !form.end_date) {
      return toast.error(lang === "ar" ? "الحقول الأساسية مطلوبة" : "Required fields missing");
    }

    let contract_file_path: string | undefined;
    if (contractFile) {
      const safe = contractFile.name.replace(/[^\w.\-]/g, "_");
      const path = `${form.partner_id}/contracts/${form.contract_number}_${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from("partner-documents").upload(path, contractFile, { upsert: true });
      if (upErr) return toast.error(upErr.message);
      contract_file_path = path;
    }

    const payload: any = {
      contract_number: form.contract_number.trim(),
      partner_id: form.partner_id,
      title: form.title.trim(),
      title_ar: form.title_ar.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date,
      renewal_notice_days: form.renewal_notice_days ? Number(form.renewal_notice_days) : null,
      contract_value: form.contract_value ? Number(form.contract_value) : null,
      currency: form.currency || null,
      responsible_department: form.responsible_department || null,
      status: form.status,
      notes: form.notes || null,
    };
    if (contract_file_path) payload.contract_file_path = contract_file_path;

    const { error } = form.id
      ? await supabase.from("partner_contracts").update(payload).eq("id", form.id)
      : await supabase.from("partner_contracts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
    setOpen(false);
    load();
  };

  const sendRenewalNotice = async (c: Contract) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: c.partner_id,
      title: lang === "ar" ? "تنبيه تجديد عقد" : "Contract renewal notice",
      message: `${lang === "ar" ? "العقد رقم" : "Contract"} ${c.contract_number} ${lang === "ar" ? "ينتهي في" : "expires on"} ${c.end_date}`,
    } as any);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم إرسال التنبيه" : "Notice sent");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{lang === "ar" ? "إدارة العقود" : "Contracts Management"}</CardTitle>
        <Button onClick={startNew} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{lang === "ar" ? "عقد جديد" : "New Contract"}</Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">{lang === "ar" ? "لا توجد عقود" : "No contracts"}</div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => {
              const days = daysUntil(c.end_date);
              const renewalSoon = c.status === "active" && days != null && days <= (c.renewal_notice_days ?? 30) && days >= 0;
              return (
                <div key={c.id} className={`flex items-center justify-between gap-2 border rounded-md p-3 ${renewalSoon ? "border-accent/50 bg-accent/5" : "border-border/60"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground">#{c.contract_number}</span>
                      <Badge variant="outline">{contractStatusLabel(c.status, lang)}</Badge>
                      {renewalSoon && <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/30">{lang === "ar" ? `${days} يوم` : `${days}d`}</Badge>}
                    </div>
                    <div className="font-medium truncate">{(lang === "ar" && c.title_ar) || c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.profiles?.company_name || c.profiles?.email} · {c.start_date} → {c.end_date}</div>
                  </div>
                  <div className="flex gap-1">
                    {renewalSoon && <Button size="sm" variant="ghost" onClick={() => sendRenewalNotice(c)} title={lang === "ar" ? "إرسال تنبيه" : "Send notice"}><Bell className="h-3.5 w-3.5" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => startEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? (lang === "ar" ? "تعديل عقد" : "Edit Contract") : (lang === "ar" ? "عقد جديد" : "New Contract")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "رقم العقد" : "Contract Number"} *</Label>
                <Input value={form.contract_number} onChange={(e) => setForm((f) => ({ ...f, contract_number: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الشريك" : "Partner"} *</Label>
                <Select value={form.partner_id || undefined} onValueChange={(v) => setForm((f) => ({ ...f, partner_id: v }))}>
                  <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر شريكاً" : "Select partner"} /></SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "تاريخ البدء" : "Start Date"} *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "تاريخ الانتهاء" : "End Date"} *</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "تنبيه التجديد (يوم)" : "Renewal Notice (days)"}</Label>
                <Input type="number" value={form.renewal_notice_days} onChange={(e) => setForm((f) => ({ ...f, renewal_notice_days: e.target.value }))} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "قيمة العقد" : "Contract Value"}</Label>
                <Input type="number" value={form.contract_value} onChange={(e) => setForm((f) => ({ ...f, contract_value: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "العملة" : "Currency"}</Label>
                <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "ar" ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ContractStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{contractStatusLabel(s, lang)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "الإدارة المسؤولة" : "Responsible Department"}</Label>
              <Input value={form.responsible_department} onChange={(e) => setForm((f) => ({ ...f, responsible_department: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> {lang === "ar" ? "ملف العقد (PDF)" : "Contract File (PDF)"}</Label>
              <Input type="file" accept=".pdf" onChange={(e) => setContractFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save}>{lang === "ar" ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
