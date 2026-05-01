import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calendar,
  FileText,
  Upload,
  Bell,
  X,
  Filter,
  Star,
  User,
} from "lucide-react";
import { VendorProfileTab } from "@/components/vendor/VendorProfileTab";
import { VendorRatingsTab } from "@/components/vendor/VendorRatingsTab";

interface Requirement {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  category: string | null;
  category_id: string | null;
  deadline: string | null;
  status: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Quotation {
  id: string;
  requirement_id: string;
  price: number;
  currency: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  ho_requirements?: { title: string; title_ar: string | null } | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [myCategoryIds, setMyCategoryIds] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all"); // "all" | "mine" | category id
  const [activeReq, setActiveReq] = useState<Requirement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?role=vendor");
  }, [user, loading, navigate]);

  const loadAll = async () => {
    if (!user) return;
    const session = await supabase.auth.getSession();
    const quotesRequest = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vendor-quotations`,
      {
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      },
    );
    const [r, quotesResponse, cats, prof, notifResult] = await Promise.all([
      supabase
        .from("ho_requirements")
        .select("*")
        .eq("status", "open")
        .order("deadline", { ascending: true, nullsFirst: false }),
      quotesRequest,
      supabase
        .from("partner_categories")
        .select("id,name,name_ar")
        .eq("active", true)
        .order("name"),
      supabase
        .from("partner_profiles")
        .select("primary_category_id,category_ids")
        .eq("partner_id", user.id)
        .maybeSingle(),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const quotesResult = await quotesResponse
      .json()
      .catch(() => ({ quotations: [] }));
    setReqs((r.data as Requirement[]) ?? []);
    setQuotations((quotesResponse.ok ? quotesResult.quotations : []) ?? []);
    setCategories((cats.data as Category[]) ?? []);
    setNotifications((notifResult.data as Notification[]) ?? []);
    const profData = prof.data as {
      primary_category_id: string | null;
      category_ids: string[];
    } | null;
    const ids = new Set<string>();
    if (profData?.primary_category_id) ids.add(profData.primary_category_id);
    (profData?.category_ids ?? []).forEach((x) => ids.add(x));
    setMyCategoryIds(Array.from(ids));
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  // Poll for new notifications every 30 seconds and toast when one arrives
  useEffect(() => {
    if (!user) return;
    let lastSeenId: string | null = null;

    const poll = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data?.length) return;
      const latest = data[0];
      if (lastSeenId === null) {
        lastSeenId = latest.id;
        return;
      }
      if (latest.id !== lastSeenId) {
        const prevDate = new Date(
          data.find((x) => x.id === lastSeenId)?.created_at ?? 0,
        );
        data
          .filter(
            (n) => n.id !== lastSeenId && new Date(n.created_at) > prevDate,
          )
          .forEach((n) => toast(n.title, { description: n.message }));
        lastSeenId = latest.id;
        setNotifications(data as Notification[]);
      }
    };

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  // Open submission dialog if ?req= present
  useEffect(() => {
    const id = params.get("req");
    if (id && reqs.length) {
      const found = reqs.find((r) => r.id === id);
      if (found) setActiveReq(found);
    }
  }, [params, reqs]);

  const closeDialog = () => {
    setActiveReq(null);
    setPrice("");
    setNotes("");
    setFiles([]);
    if (params.get("req")) {
      params.delete("req");
      setParams(params, { replace: true });
    }
  };

  const onSubmit = async () => {
    if (!user || !activeReq) return;
    const p = Number(price);
    if (!p || p <= 0)
      return toast.error(
        lang === "ar" ? "أدخل سعراً صحيحاً" : "Enter a valid price",
      );
    setSubmitting(true);

    const session = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vendor-quotations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement_id: activeReq.id,
          price: p,
          notes: notes || null,
        }),
      },
    );
    const result = await response.json().catch(() => ({}));
    const q = result.quotation as { id: string } | undefined;

    if (!response.ok || !q) {
      setSubmitting(false);
      return toast.error(result.error ?? "Error");
    }

    // Upload files
    for (const f of files) {
      const path = `${user.id}/${q.id}/${Date.now()}-${f.name}`;
      const { error: upErr } = await supabase.storage
        .from("vendor-documents")
        .upload(path, f, {
          cacheControl: "3600",
        });
      if (upErr) {
        toast.error(`${f.name}: ${upErr.message}`);
        continue;
      }
      const docResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vendor-quotations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.data.session?.access_token ?? ""}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "document",
            quotation_id: q.id,
            file_name: f.name,
            file_path: path,
            mime_type: f.type,
            size_bytes: f.size,
          }),
        },
      );
      if (!docResponse.ok)
        toast.error(
          `${f.name}: ${lang === "ar" ? "تعذر حفظ بيانات الملف" : "Unable to save file details"}`,
        );
    }

    setSubmitting(false);
    toast.success(t("qf.success"));
    closeDialog();
    loadAll();
  };

  const statusBadge = (s: Quotation["status"]) => {
    const map = {
      pending: "bg-accent/15 text-accent-foreground border-accent/30",
      approved: "bg-success/15 text-success border-success/30",
      rejected: "bg-destructive/10 text-destructive border-destructive/30",
    };
    return (
      <Badge variant="outline" className={map[s]}>
        {t(`status.${s}` as `status.${Quotation["status"]}`)}
      </Badge>
    );
  };

  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const filteredReqs = useMemo(() => {
    if (filterCat === "all") return reqs;
    if (filterCat === "mine") {
      if (!myCategoryIds.length) return reqs;
      return reqs.filter(
        (r) => r.category_id && myCategoryIds.includes(r.category_id),
      );
    }
    return reqs.filter((r) => r.category_id === filterCat);
  }, [reqs, filterCat, myCategoryIds]);

  const categoryName = (id: string | null) => {
    if (!id) return null;
    const c = categories.find((x) => x.id === id);
    return c ? (lang === "ar" && c.name_ar) || c.name : null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dash.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{user?.email}</p>
        </div>

        <Tabs defaultValue="tenders">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="tenders">{t("dash.open_tenders")}</TabsTrigger>
            <TabsTrigger value="quotes">{t("dash.my_quotations")}</TabsTrigger>
            <TabsTrigger value="ratings" className="gap-1.5">
              <Star className="h-3.5 w-3.5" />
              {lang === "ar" ? "تقييماتي" : "My Ratings"}
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              {lang === "ar" ? "ملف الشركة" : "Profile"}
            </TabsTrigger>
            <TabsTrigger value="notifs" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              {t("dash.notifications")}
              {unread > 0 && (
                <Badge className="bg-accent text-accent-foreground h-5 px-1.5">
                  {unread}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenders" className="mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                {lang === "ar" ? "تصفية" : "Filter"}
              </div>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === "ar" ? "كل المناقصات" : "All tenders"}
                  </SelectItem>
                  <SelectItem value="mine" disabled={!myCategoryIds.length}>
                    {lang === "ar"
                      ? "مطابقة لتصنيفاتي"
                      : "Matching my categories"}
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(lang === "ar" && c.name_ar) || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {filteredReqs.length} {lang === "ar" ? "نتيجة" : "results"}
              </span>
            </div>
            {filteredReqs.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  {t("req.no_open")}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredReqs.map((r) => (
                  <Card key={r.id} className="border-border/60 shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {(lang === "ar" && r.title_ar) || r.title}
                      </CardTitle>
                      {(categoryName(r.category_id) || r.category) && (
                        <CardDescription>
                          {categoryName(r.category_id) || r.category}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {(lang === "ar" && r.description_ar) || r.description}
                      </p>
                      {r.deadline && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {t("req.deadline")}:{" "}
                          {new Date(r.deadline).toLocaleDateString(
                            lang === "ar" ? "ar-KW" : "en-GB",
                          )}
                        </div>
                      )}
                      <Button
                        onClick={() => setActiveReq(r)}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {t("req.submit")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            {quotations.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  {t("dash.no_quotations")}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {quotations.map((q) => (
                  <Card key={q.id} className="border-border/60">
                    <CardContent className="p-5 flex flex-wrap items-center gap-4 justify-between">
                      <div>
                        <div className="font-semibold">
                          {(lang === "ar" && q.ho_requirements?.title_ar) ||
                            q.ho_requirements?.title ||
                            "—"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {q.price.toLocaleString()} {q.currency} ·{" "}
                          {new Date(q.created_at).toLocaleDateString(
                            lang === "ar" ? "ar-KW" : "en-GB",
                          )}
                        </div>
                        {q.notes && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-xl">
                            {q.notes}
                          </div>
                        )}
                      </div>
                      {statusBadge(q.status)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ratings" className="mt-6">
            <VendorRatingsTab />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <VendorProfileTab />
          </TabsContent>

          <TabsContent value="notifs" className="mt-6">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  {t("dash.no_notifications")}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <Card
                    key={n.id}
                    className={
                      n.read
                        ? "border-border/60"
                        : "border-accent/40 bg-accent/5"
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {n.created_at &&
                          !isNaN(new Date(n.created_at).getTime())
                            ? new Date(n.created_at).toLocaleDateString(
                                lang === "ar" ? "ar-KW" : "en-GB",
                              )
                            : ""}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {n.message}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Submit quotation dialog */}
      <Dialog open={!!activeReq} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("qf.title")}</DialogTitle>
            <DialogDescription>
              {activeReq &&
                ((lang === "ar" && activeReq.title_ar) || activeReq.title)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">{t("qf.price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">{t("qf.notes")}</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("qf.documents")}</Label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-md p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {lang === "ar" ? "اختر ملفات" : "Choose files"}
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {files.length > 0 && (
                <ul className="text-xs space-y-1 mt-2">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 bg-secondary/50 rounded px-2 py-1"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="h-3 w-3" /> {f.name}
                      </span>
                      <button
                        onClick={() =>
                          setFiles(files.filter((_, j) => j !== i))
                        }
                        aria-label="remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? t("auth.processing") : t("qf.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
