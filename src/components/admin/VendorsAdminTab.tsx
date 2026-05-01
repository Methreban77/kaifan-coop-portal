import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Star, Check, Ban, Play } from "lucide-react";
import { partnerStatusLabel, type PartnerStatus } from "@/lib/partnerHelpers";

type Row = {
  partner_id: string;
  email: string | null;
  company_name: string | null;
  contact_person: string | null;
  contact_mobile: string | null;
  avg_rating: number;
  ratings_count: number;
  approval_status: PartnerStatus;
  primary_category: string | null;
};

export function VendorsAdminTab() {
  const { lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Row | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const load = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-partners", { method: "GET" });
      if (error) throw error;

      const vp = data?.partners ?? [];
      const profiles = data?.profiles ?? [];
      const cats = data?.categories ?? [];

      const profMap = new Map<string, { email: string | null; company_name: string | null }>((profiles ?? []).map((p: any) => [p.id, p]));
      const catMap = new Map((cats ?? []).map((c: any) => [c.id, lang === "ar" ? (c.name_ar ?? c.name) : c.name]));

      setRows(
        (vp ?? []).map((v: any) => ({
          partner_id: v.partner_id,
          email: profMap.get(v.partner_id)?.email ?? null,
          company_name: profMap.get(v.partner_id)?.company_name ?? null,
          contact_person: v.contact_person,
          contact_mobile: v.contact_mobile,
          avg_rating: Number(v.avg_rating),
          ratings_count: v.ratings_count,
          approval_status: v.approval_status,
          primary_category: v.primary_category_id ? catMap.get(v.primary_category_id) ?? null : null,
        })),
      );
    } catch (error: any) {
      const message = error?.message ?? (lang === "ar" ? "تعذر تحميل معلومات الشركاء" : "Unable to load partners");
      setRows([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [lang]);

  const updateStatus = async (partnerId: string, status: PartnerStatus, reason?: string | null) => {
    const { error } = await supabase.functions.invoke("admin-partners", {
      method: "PATCH",
      body: { partnerId, status, reason: reason ?? null },
    });
    if (error) return toast.error(error.message);

    toast.success(lang === "ar" ? "تم التحديث" : "Updated");
    load();
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    await updateStatus(suspendTarget.partner_id, "suspended", suspendReason || null);
    setSuspendTarget(null); setSuspendReason("");
  };

  const statusBadge = (s: PartnerStatus) => {
    const cls =
      s === "active" ? "bg-success/15 text-success border-success/30"
      : s === "suspended" || s === "rejected" ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-accent/15 text-accent-foreground border-accent/30";
    return <Badge variant="outline" className={cls}>{partnerStatusLabel(s, lang)}</Badge>;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang === "ar" ? "الشركة" : "Company"}</TableHead>
              <TableHead>{lang === "ar" ? "التصنيف" : "Category"}</TableHead>
              <TableHead>{lang === "ar" ? "التقييم" : "Rating"}</TableHead>
              <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
              <TableHead className="text-right">{lang === "ar" ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</TableCell></TableRow>
            ) : errorMessage ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-destructive">{errorMessage}</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{lang === "ar" ? "لا يوجد شركاء" : "No partners"}</TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.partner_id}>
                  <TableCell>
                    <div className="font-medium">{r.company_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                    {r.contact_person && <div className="text-xs text-muted-foreground">{r.contact_person} · {r.contact_mobile}</div>}
                  </TableCell>
                  <TableCell>{r.primary_category || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{r.avg_rating.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">({r.ratings_count})</span>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(r.approval_status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {r.approval_status !== "active" && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(r.partner_id, "active")} title={lang === "ar" ? "اعتماد" : "Approve"}>
                          <Check className="h-3.5 w-3.5 text-success" />
                        </Button>
                      )}
                      {r.approval_status === "active" && (
                        <Button size="sm" variant="ghost" onClick={() => setSuspendTarget(r)} title={lang === "ar" ? "إيقاف" : "Suspend"}>
                          <Ban className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                      {r.approval_status === "suspended" && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(r.partner_id, "active")} title={lang === "ar" ? "إعادة تفعيل" : "Reactivate"}>
                          <Play className="h-3.5 w-3.5 text-success" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إيقاف الشريك" : "Suspend Partner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{suspendTarget?.company_name || suspendTarget?.email}</div>
            <Label>{lang === "ar" ? "سبب الإيقاف" : "Suspension Reason"}</Label>
            <Textarea rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={confirmSuspend}>{lang === "ar" ? "إيقاف" : "Suspend"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
