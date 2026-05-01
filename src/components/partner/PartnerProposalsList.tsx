import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { withSupabaseRetry } from "@/lib/supabaseRetry";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { proposalStatusColor, proposalStatusLabel, type ProposalStatus, requestTypeLabel, type RequestType } from "@/lib/partnerHelpers";

interface Proposal {
  id: string;
  request_id: string;
  financial_offer: number;
  currency: string;
  status: ProposalStatus;
  delivery_period_days: number | null;
  warranty_period_months: number | null;
  reviewer_notes: string | null;
  created_at: string;
  partner_requests?: { title: string; title_ar: string | null; request_type: RequestType } | null;
}

export function PartnerProposalsList() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Proposal[]>([]);

  useEffect(() => {
    if (!user) return;
    withSupabaseRetry(() =>
      supabase
        .from("partner_proposals")
        .select("*, partner_requests(title,title_ar,request_type)")
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false }),
    )
      .then(({ data }) => {
        setItems((data as any) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!items.length) return <Card><CardContent className="p-10 text-center text-muted-foreground">{lang === "ar" ? "لا توجد عروض مقدمة بعد" : "No proposals submitted yet"}</CardContent></Card>;

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <Card key={p.id} className="border-border/60">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                {p.partner_requests && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                    {requestTypeLabel(p.partner_requests.request_type, lang)}
                  </Badge>
                )}
                <div className="font-semibold">
                  {(lang === "ar" && p.partner_requests?.title_ar) || p.partner_requests?.title || "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.financial_offer.toLocaleString()} {p.currency}
                  {p.delivery_period_days != null && <> · {p.delivery_period_days} {lang === "ar" ? "يوم" : "days"}</>}
                  {p.warranty_period_months != null && <> · {lang === "ar" ? "ضمان" : "warranty"} {p.warranty_period_months} {lang === "ar" ? "شهر" : "mo"}</>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")}
                </div>
                {p.reviewer_notes && (
                  <div className="text-xs bg-secondary/40 rounded p-2 mt-1 max-w-xl">
                    <span className="font-medium">{lang === "ar" ? "ملاحظات المراجع:" : "Reviewer notes:"}</span> {p.reviewer_notes}
                  </div>
                )}
              </div>
              <Badge variant="outline" className={proposalStatusColor(p.status)}>
                {proposalStatusLabel(p.status, lang)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
