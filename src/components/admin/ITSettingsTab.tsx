import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Database, Plug, Server, Activity } from "lucide-react";

export function ITSettingsTab() {
  const { lang } = useI18n();
  const items = [
    {
      icon: Database,
      title: lang === "ar" ? "قاعدة البيانات" : "Database",
      desc: lang === "ar" ? "Lovable Cloud — متصلة" : "Lovable Cloud — connected",
      status: "active",
    },
    {
      icon: Plug,
      title: lang === "ar" ? "تكامل IBR" : "IBR Integration",
      desc: lang === "ar" ? "لم يتم الإعداد بعد" : "Not configured",
      status: "pending",
    },
    {
      icon: Server,
      title: lang === "ar" ? "وظائف الحافة" : "Edge Functions",
      desc: lang === "ar" ? "جاهزة للنشر" : "Ready to deploy",
      status: "active",
    },
    {
      icon: Activity,
      title: lang === "ar" ? "حالة النظام" : "System Health",
      desc: lang === "ar" ? "جميع الخدمات تعمل" : "All services operational",
      status: "active",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((it) => (
        <Card key={it.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <it.icon className="h-4 w-4 text-primary" />
              {it.title}
            </CardTitle>
            <Badge variant={it.status === "active" ? "default" : "secondary"}>
              {it.status === "active"
                ? lang === "ar" ? "نشط" : "Active"
                : lang === "ar" ? "قيد الإعداد" : "Pending"}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{it.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
