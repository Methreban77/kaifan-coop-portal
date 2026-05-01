import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Eye } from "lucide-react";
import { PROPOSAL_STATUSES, proposalStatusColor, proposalStatusLabel, type ProposalStatus, requestTypeLabel } from "@/lib/partnerHelpers";

interface Proposal {
  id: string;
  request_id: string;
  partner_id: string;
  financial_offer: number;
  currency: string;
  technical_offer: string | null;
  delivery_period_days: number | null;
  warranty_period_months: number | null;
  sla: string | null;
  notes: string | null;
  exceptions: string | null;
  status: ProposalStatus;
  technical_score: number | null;
  financial_score: number | null;
  reviewer_notes: string | null;
  created_at: string;
  partner_requests?: { title: string; title_ar: string | null; request_type: any } | null;
  profiles?: { company_name: string | null; email: string | null } | null;
}

interface ProposalDoc { id: string; doc_type: string; file_name: string; file_path: string; }

export function PartnerProposalsAdminTab() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [items, setItems] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<Proposal | null>(null);
  const [docs, setDocs] = useState<ProposalDoc[]>([]);
  const [editForm, setEditForm] = useState({ status: "submitted" as ProposalStatus, technical_score: "", financial_score: "", reviewer_notes: "" });

  const load = async () => {
    const { data } = await supabase
      .from("partner_proposals")
      .select("*, partner_requests(title,title_ar,request_type)")
      .order("created_at", { ascending: false });
    const list = (data as any[]) ?? [];
    const partnerIds = Array.from(new Set(list.map((p) => p.partner_id)));
    const { data: profiles } = partnerIds.length
      ? await supabase.from("profiles").select("id, company_name, email").in("id", partnerIds)
      : { data: [] as any[] };
    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    setItems(list.map((p) => ({ ...p, profiles: profMap.get(p.partner_id) ?? null })));
  };

  useEffect(() => { load(); }, []);

  const openProposal = async (p: Proposal) => {
    setActive(p);
    setEditForm({
      status: p.status,
      technical_score: p.technical_score != null ? String(p.technical_score) : "",
      financial_score: p.financial_score != null ? String(p.financial_score) : "",
      reviewer_notes: p.reviewer_notes ?? "",
    });
    const { data } = await supabase.from("partner_proposal_documents").select("*").eq("proposal_id", p.id);
    setDocs((data as any) ?? []);
  };

  const downloadDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("partner-documents").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const save = async () => {
    if (!active || !user) return;
    const newStatus = editForm.status;
    const update = {
      status: newStatus,
      technical_score: editForm.technical_score ? Number(editForm.technical_score) : null,
      financial_score: editForm.financial_score ? Number(editForm.financial_score) : null,
      reviewer_notes: editForm.reviewer_notes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("partner_proposals").update(update).eq("id", active.id);
    if (error) return toast.error(error.message);

    if (newStatus !== active.status) {
      await supabase.from("partner_review_history").insert({
        proposal_id: active.id,
        from_status: active.status,
        to_status: newStatus,
        actor_id: user.id,
        notes: editForm.reviewer_notes || null,
      } as any);
      // Notify partner
      await supabase.from("notifications").insert({
        user_id: active.partner_id,
        title: lang === "ar" ? "تحديث حالة العرض" : "Proposal status updated",
        message: `${lang === "ar" ? "تم تغيير حالة عرضك إلى" : "Your proposal status changed to"}: ${proposalStatusLabel(newStatus, lang)}`,
      } as any);
    }
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
    setActive(null);
    load();
  };

  const filtered = filter === "all" ? items : items.filter((p) => p.status === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">{lang === "ar" ? "مراجعة العروض" : "Proposals Review"}</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "ar" ? "كل الحالات" : "All statuses"}</SelectItem>
              {PROPOSAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{proposalStatusLabel(s, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">{lang === "ar" ? "لا توجد عروض" : "No proposals"}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 border border-border/60 rounded-md p-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {p.partner_requests && <Badge variant="outline">{requestTypeLabel(p.partner_requests.request_type, lang)}</Badge>}
                    <Badge variant="outline" className={proposalStatusColor(p.status)}>{proposalStatusLabel(p.status, lang)}</Badge>
                  </div>
                  <div className="font-medium truncate">{(lang === "ar" && p.partner_requests?.title_ar) || p.partner_requests?.title || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.profiles?.company_name || p.profiles?.email || p.partner_id.slice(0, 8)}
                    {" · "}{p.financial_offer.toLocaleString()} {p.currency}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openProposal(p)} className="gap-1.5"><Eye className="h-3.5 w-3.5" /> {lang === "ar" ? "مراجعة" : "Review"}</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تفاصيل العرض" : "Proposal Details"}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{lang === "ar" ? "الشركة:" : "Company:"}</span> <span className="font-medium">{active.profiles?.company_name || active.profiles?.email}</span></div>
                <div><span className="text-muted-foreground">{lang === "ar" ? "العرض المالي:" : "Financial:"}</span> <span className="font-medium">{active.financial_offer.toLocaleString()} {active.currency}</span></div>
                {active.delivery_period_days != null && <div><span className="text-muted-foreground">{lang === "ar" ? "التسليم:" : "Delivery:"}</span> {active.delivery_period_days} {lang === "ar" ? "يوم" : "days"}</div>}
                {active.warranty_period_months != null && <div><span className="text-muted-foreground">{lang === "ar" ? "الضمان:" : "Warranty:"}</span> {active.warranty_period_months} {lang === "ar" ? "شهر" : "months"}</div>}
              </div>
              {active.technical_offer && (
                <div><div className="text-xs font-medium text-muted-foreground mb-1">{lang === "ar" ? "العرض الفني" : "Technical Offer"}</div><div className="text-sm whitespace-pre-wrap bg-secondary/30 rounded p-2">{active.technical_offer}</div></div>
              )}
              {active.sla && (
                <div><div className="text-xs font-medium text-muted-foreground mb-1">SLA</div><div className="text-sm whitespace-pre-wrap bg-secondary/30 rounded p-2">{active.sla}</div></div>
              )}
              {active.exceptions && (
                <div><div className="text-xs font-medium text-muted-foreground mb-1">{lang === "ar" ? "ملاحظات/استثناءات" : "Notes/Exceptions"}</div><div className="text-sm whitespace-pre-wrap bg-secondary/30 rounded p-2">{active.exceptions}</div></div>
              )}
              {docs.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">{lang === "ar" ? "المرفقات" : "Attachments"}</div>
                  <div className="space-y-1">
                    {docs.map((d) => (
                      <button key={d.id} onClick={() => downloadDoc(d.file_path)} className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <FileText className="h-3.5 w-3.5" /> [{d.doc_type}] {d.file_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="font-medium text-sm">{lang === "ar" ? "إجراء المراجعة" : "Review Action"}</div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>{lang === "ar" ? "الحالة الجديدة" : "New Status"}</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as ProposalStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROPOSAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{proposalStatusLabel(s, lang)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{lang === "ar" ? "الدرجة الفنية (0-100)" : "Technical Score (0-100)"}</Label>
                    <Input type="number" min="0" max="100" value={editForm.technical_score} onChange={(e) => setEditForm((f) => ({ ...f, technical_score: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{lang === "ar" ? "الدرجة المالية (0-100)" : "Financial Score (0-100)"}</Label>
                    <Input type="number" min="0" max="100" value={editForm.financial_score} onChange={(e) => setEditForm((f) => ({ ...f, financial_score: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "ar" ? "ملاحظات المراجع" : "Reviewer Notes"}</Label>
                  <Textarea rows={3} value={editForm.reviewer_notes} onChange={(e) => setEditForm((f) => ({ ...f, reviewer_notes: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>{lang === "ar" ? "إغلاق" : "Close"}</Button>
            <Button onClick={save}>{lang === "ar" ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
