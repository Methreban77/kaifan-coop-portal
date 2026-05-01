import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";
import { requestTypeLabel, type RequestType } from "@/lib/partnerHelpers";
import { z } from "zod";

interface PartnerRequest {
  id: string;
  request_type: RequestType;
  title: string;
  title_ar: string | null;
  currency: string;
}

const schema = z.object({
  financial_offer: z.number().positive(),
  technical_offer: z.string().trim().max(5000).nullable(),
  delivery_period_days: z.number().int().min(0).max(3650).nullable(),
  warranty_period_months: z.number().int().min(0).max(600).nullable(),
  sla: z.string().trim().max(2000).nullable(),
  notes: z.string().trim().max(2000).nullable(),
  exceptions: z.string().trim().max(2000).nullable(),
});

type FileSlot = { type: "technical" | "financial" | "attachment"; file: File };

export function ProposalDialog({ request, onClose }: { request: PartnerRequest | null; onClose: () => void }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    financial_offer: "",
    technical_offer: "",
    delivery_period_days: "",
    warranty_period_months: "",
    sla: "",
    notes: "",
    exceptions: "",
  });
  const [files, setFiles] = useState<FileSlot[]>([]);

  const reset = () => {
    setForm({ financial_offer: "", technical_offer: "", delivery_period_days: "", warranty_period_months: "", sla: "", notes: "", exceptions: "" });
    setFiles([]);
  };

  const close = () => { reset(); onClose(); };

  const addFiles = (type: FileSlot["type"], list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).map((file) => ({ type, file }));
    setFiles((f) => [...f, ...arr]);
  };

  const onSubmit = async () => {
    if (!user || !request) return;
    const parsed = schema.safeParse({
      financial_offer: Number(form.financial_offer),
      technical_offer: form.technical_offer || null,
      delivery_period_days: form.delivery_period_days ? Number(form.delivery_period_days) : null,
      warranty_period_months: form.warranty_period_months ? Number(form.warranty_period_months) : null,
      sla: form.sla || null,
      notes: form.notes || null,
      exceptions: form.exceptions || null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    const { data: prop, error } = await supabase.from("partner_proposals").insert({
      request_id: request.id,
      partner_id: user.id,
      currency: request.currency,
      ...parsed.data,
    } as any).select().single();

    if (error || !prop) {
      setSubmitting(false);
      return toast.error(error?.message ?? "Error");
    }

    for (const slot of files) {
      const safe = slot.file.name.replace(/[^\w.\-]/g, "_");
      const path = `${user.id}/proposals/${prop.id}/${slot.type}_${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from("partner-documents").upload(path, slot.file);
      if (upErr) { toast.error(`${slot.file.name}: ${upErr.message}`); continue; }
      await supabase.from("partner_proposal_documents").insert({
        proposal_id: prop.id,
        doc_type: slot.type,
        file_name: slot.file.name,
        file_path: path,
        mime_type: slot.file.type,
        size_bytes: slot.file.size,
      } as any);
    }

    setSubmitting(false);
    toast.success(lang === "ar" ? "تم تقديم العرض بنجاح" : "Proposal submitted successfully");
    close();
  };

  if (!request) return null;

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang === "ar" ? "تقديم عرض" : "Submit Proposal"}</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{requestTypeLabel(request.request_type, lang)}</span> · {(lang === "ar" && request.title_ar) || request.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fo">{lang === "ar" ? "العرض المالي" : "Financial Offer"} ({request.currency}) *</Label>
              <Input id="fo" type="number" step="0.001" min="0" value={form.financial_offer} onChange={(e) => setForm((f) => ({ ...f, financial_offer: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dp">{lang === "ar" ? "مدة التسليم (يوم)" : "Delivery Period (days)"}</Label>
              <Input id="dp" type="number" min="0" value={form.delivery_period_days} onChange={(e) => setForm((f) => ({ ...f, delivery_period_days: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wp">{lang === "ar" ? "مدة الضمان (شهر)" : "Warranty (months)"}</Label>
              <Input id="wp" type="number" min="0" value={form.warranty_period_months} onChange={(e) => setForm((f) => ({ ...f, warranty_period_months: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="to">{lang === "ar" ? "العرض الفني" : "Technical Offer"}</Label>
            <Textarea id="to" rows={3} value={form.technical_offer} onChange={(e) => setForm((f) => ({ ...f, technical_offer: e.target.value }))} placeholder={lang === "ar" ? "وصف الحل التقني، المواصفات، المنهجية..." : "Technical solution, specs, methodology..."} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sla">{lang === "ar" ? "اتفاقية مستوى الخدمة (SLA)" : "Service Level Agreement (SLA)"}</Label>
            <Textarea id="sla" rows={2} value={form.sla} onChange={(e) => setForm((f) => ({ ...f, sla: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exc">{lang === "ar" ? "ملاحظات واستثناءات" : "Notes & Exceptions"}</Label>
            <Textarea id="exc" rows={2} value={form.exceptions} onChange={(e) => setForm((f) => ({ ...f, exceptions: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>{lang === "ar" ? "المرفقات (PDF/Excel)" : "Attachments (PDF/Excel)"}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["technical","financial","attachment"] as const).map((t) => (
                <label key={t} className="flex items-center justify-center gap-1.5 border-2 border-dashed border-border rounded p-2 cursor-pointer hover:bg-secondary/30 transition-colors text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" />
                  {t === "technical" ? (lang === "ar" ? "فني" : "Technical") : t === "financial" ? (lang === "ar" ? "مالي" : "Financial") : (lang === "ar" ? "أخرى" : "Other")}
                  <input type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx" className="hidden" onChange={(e) => addFiles(t, e.target.files)} />
                </label>
              ))}
            </div>
            {files.length > 0 && (
              <ul className="text-xs space-y-1 mt-1">
                {files.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 bg-secondary/40 rounded px-2 py-1">
                    <span className="flex items-center gap-1.5 truncate"><FileText className="h-3 w-3" /> [{s.type}] {s.file.name}</span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="remove">
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={onSubmit} disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {submitting ? (lang === "ar" ? "جارٍ الإرسال..." : "Submitting...") : (lang === "ar" ? "إرسال العرض" : "Submit Proposal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
