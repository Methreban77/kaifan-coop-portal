import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Plus, Trash2, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = [
  "admin",
  "it_admin",
  "hr_admin",
  "procurement_admin",
  "shareholder_admin",
  "partner_admin",
  "manager",
  "employee",
  "shareholder",
  "vendor",
  "partner",
];

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  roles: AppRole[];
};

export function UsersTab() {
  const { lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Record<string, AppRole | "">>({});

  const load = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, company_name")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const byUser = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role);
      byUser.set(r.user_id, arr);
    });
    setRows(
      (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        company_name: p.company_name,
        roles: byUser.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addRole = async (userId: string) => {
    const role = adding[userId];
    if (!role) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "ar" ? "تمت إضافة الدور" : "Role added");
    setAdding((s) => ({ ...s, [userId]: "" }));
    load();
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "ar" ? "تم حذف الدور" : "Role removed");
    load();
  };

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return (
      !s ||
      r.email?.toLowerCase().includes(s) ||
      r.full_name?.toLowerCase().includes(s) ||
      r.company_name?.toLowerCase().includes(s)
    );
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={lang === "ar" ? "بحث بالبريد أو الاسم..." : "Search by email or name..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} {lang === "ar" ? "مستخدم" : "users"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "ar" ? "المستخدم" : "User"}</TableHead>
                <TableHead>{lang === "ar" ? "الأدوار" : "Roles"}</TableHead>
                <TableHead>{lang === "ar" ? "إضافة دور" : "Add role"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {lang === "ar" ? "جارٍ التحميل..." : "Loading..."}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {lang === "ar" ? "لا يوجد مستخدمون" : "No users"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.full_name || u.company_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {lang === "ar" ? "لا توجد أدوار" : "No roles"}
                          </span>
                        ) : (
                          u.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="gap-1">
                              {r}
                              <button
                                onClick={() => removeRole(u.id, r)}
                                className="hover:text-destructive ml-1"
                                aria-label="Remove role"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={adding[u.id] || ""}
                          onValueChange={(v) => setAdding((s) => ({ ...s, [u.id]: v as AppRole }))}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={lang === "ar" ? "اختر دور" : "Select role"} />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => addRole(u.id)} disabled={!adding[u.id]}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
