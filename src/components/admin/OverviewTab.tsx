import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { withSupabaseRetry } from "@/lib/supabaseRetry";
import { Users, Briefcase, FileText, Star, ShoppingCart, ShieldCheck } from "lucide-react";

type Stats = {
  users: number;
  vendors: number;
  tenders: number;
  openTenders: number;
  quotations: number;
  pendingQuotations: number;
};

function safeCount(result: { count: number | null; error: unknown }) {
  return result.error ? 0 : result.count ?? 0;
}

export function OverviewTab() {
  const { lang } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const users = await withSupabaseRetry(() => supabase.from("profiles").select("id", { count: "exact", head: true }));
      const vendors = await withSupabaseRetry(() => supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "vendor"));
      const tenders = await withSupabaseRetry(() => supabase.from("ho_requirements").select("id", { count: "exact", head: true }));
      const openT = await withSupabaseRetry(() => supabase.from("ho_requirements").select("id", { count: "exact", head: true }).eq("status", "open"));
      const quotations = await withSupabaseRetry(() => supabase.from("quotations").select("id", { count: "exact", head: true }));
      const pendingQ = await withSupabaseRetry(() => supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "pending"));
      setStats({
        users: safeCount(users),
        vendors: safeCount(vendors),
        tenders: safeCount(tenders),
        openTenders: safeCount(openT),
        quotations: safeCount(quotations),
        pendingQuotations: safeCount(pendingQ),
      });
    })();
  }, []);

  const cards = [
    { icon: Users, label: lang === "ar" ? "المستخدمون" : "Users", value: stats?.users },
    { icon: Briefcase, label: lang === "ar" ? "الموردون" : "Vendors", value: stats?.vendors },
    { icon: FileText, label: lang === "ar" ? "إجمالي المناقصات" : "Total Tenders", value: stats?.tenders },
    { icon: ShieldCheck, label: lang === "ar" ? "مناقصات مفتوحة" : "Open Tenders", value: stats?.openTenders },
    { icon: ShoppingCart, label: lang === "ar" ? "إجمالي العروض" : "Total Quotations", value: stats?.quotations },
    { icon: Star, label: lang === "ar" ? "عروض قيد المراجعة" : "Pending Quotations", value: stats?.pendingQuotations },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <c.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{c.value ?? "—"}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
