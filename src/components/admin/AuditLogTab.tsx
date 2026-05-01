import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";

type Row = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
};

export function AuditLogTab() {
  const { lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error) setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang === "ar" ? "الوقت" : "Time"}</TableHead>
              <TableHead>{lang === "ar" ? "الإجراء" : "Action"}</TableHead>
              <TableHead>{lang === "ar" ? "الكيان" : "Entity"}</TableHead>
              <TableHead>{lang === "ar" ? "المعرف" : "ID"}</TableHead>
              <TableHead>{lang === "ar" ? "تفاصيل" : "Details"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {lang === "ar" ? "لا توجد سجلات تدقيق بعد" : "No audit entries yet"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(r.created_at), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">{r.action}</TableCell>
                  <TableCell>{r.entity_type || "—"}</TableCell>
                  <TableCell className="text-xs font-mono">{r.entity_id || "—"}</TableCell>
                  <TableCell className="text-xs max-w-md truncate">
                    {r.details ? JSON.stringify(r.details) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
