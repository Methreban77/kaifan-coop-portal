import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { withSupabaseRetry } from "@/lib/supabaseRetry";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar, Bell } from "lucide-react";
import { contractStatusLabel, daysUntil, type ContractStatus } from "@/lib/partnerHelpers";

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  title_ar: string | null;
  start_date: string;
  end_date: string;
  renewal_notice_days: number | null;
  contract_value: number | null;
  currency: string | null;
  responsible_department: string | null;
  status: ContractStatus;
  contract_file_path: string | null;
}

export function PartnerContractsList() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Contract[]>([]);

  useEffect(() => {
    if (!user) return;
    withSupabaseRetry(() =>
      supabase
        .from("partner_contracts")
        .select("*")
        .eq("partner_id", user.id)
        .order("end_date", { ascending: true }),
    )
      .then(({ data }) => {
        setItems((data as any) ?? []);
        setLoading(false);
      });
  }, [user]);

  const downloadFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("partner-documents").createSignedUrl(path, 60);
    if (error) return;
    window.open(data.signedUrl, "_blank");
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!items.length) return <Card><CardContent className="p-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد عقود" : "No contracts"}</CardContent></Card>;

  const statusColor = (s: ContractStatus) =>
    s === "active" ? "bg-success/15 text-success border-success/30"
    : s === "expired" || s === "terminated" ? "bg-destructive/10 text-destructive border-destructive/30"
    : s === "renewed" ? "bg-primary/15 text-primary border-primary/30"
    : "bg-secondary text-secondary-foreground border-border";

  return (
    <div className="space-y-3">
      {items.map((c) => {
        const days = daysUntil(c.end_date);
        const renewalSoon = c.status === "active" && days != null && days <= (c.renewal_notice_days ?? 30) && days >= 0;
        return (
          <Card key={c.id} className={`border-border/60 ${renewalSoon ? "border-accent/50 bg-accent/5" : ""}`}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{c.contract_number}</span>
                    {renewalSoon && (
                      <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/30 gap-1">
                        <Bell className="h-3 w-3" />
                        {lang === "ar" ? `تجديد خلال ${days} يوم` : `Renewal in ${days} days`}
                      </Badge>
                    )}
                  </div>
                  <div className="font-semibold">{(lang === "ar" && c.title_ar) || c.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(c.start_date).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")} → {new Date(c.end_date).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")}
                  </div>
                  {c.contract_value != null && (
                    <div className="text-sm">
                      <span className="font-medium">{c.contract_value.toLocaleString()} {c.currency}</span>
                      {c.responsible_department && <span className="text-muted-foreground"> · {c.responsible_department}</span>}
                    </div>
                  )}
                  {c.contract_file_path && (
                    <button onClick={() => downloadFile(c.contract_file_path!)} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" /> {lang === "ar" ? "تحميل العقد" : "Download contract"}
                    </button>
                  )}
                </div>
                <Badge variant="outline" className={statusColor(c.status)}>{contractStatusLabel(c.status, lang)}</Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
