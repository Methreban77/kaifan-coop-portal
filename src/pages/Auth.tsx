import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, Users, Store, Handshake, ShieldCheck } from "lucide-react";
import { pathForRole } from "@/lib/redirectByRole";
import { fetchCurrentUserRoles } from "@/lib/roles";

type PortalRole = "vendor" | "employee" | "shareholder" | "partner" | "admin";

const portals: Record<PortalRole, { icon: typeof Users; titleEn: string; titleAr: string; descEn: string; descAr: string; canSignup: boolean }> = {
  shareholder: { icon: Users, titleEn: "Shareholder Portal", titleAr: "بوابة المساهمين", descEn: "Sign in with credentials issued by management.", descAr: "سجّل الدخول بالبيانات الصادرة من الإدارة.", canSignup: false },
  employee: { icon: Briefcase, titleEn: "Employee Portal", titleAr: "بوابة الموظفين", descEn: "Sign in with credentials issued by HR.", descAr: "سجّل الدخول بالبيانات الصادرة من الموارد البشرية.", canSignup: false },
  vendor: { icon: Store, titleEn: "Vendor Portal", titleAr: "بوابة الموردين", descEn: "Sign in or create a new vendor account.", descAr: "سجّل الدخول أو أنشئ حساب مورد جديد.", canSignup: true },
  partner: { icon: Handshake, titleEn: "Partner Portal", titleAr: "بوابة الشركاء", descEn: "Sign in with credentials approved by admin.", descAr: "سجّل الدخول بالبيانات المعتمدة من الإدارة.", canSignup: false },
  admin: { icon: ShieldCheck, titleEn: "Admin Portal", titleAr: "بوابة الإدارة", descEn: "Restricted area for management & IT.", descAr: "منطقة محظورة للإدارة وتقنية المعلومات.", canSignup: false },
};

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});
const signUpSchema = signInSchema.extend({
  full_name: z.string().trim().min(2).max(100),
  company_name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(6).max(30),
});

export default function Auth() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialRole = (params.get("role") as PortalRole) || "vendor";
  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";

  const [role, setRole] = useState<PortalRole>(
    (["vendor", "employee", "shareholder", "partner", "admin"] as PortalRole[]).includes(initialRole)
      ? initialRole : "vendor"
  );
  const [tab, setTab] = useState<"signin" | "signup">(initialMode as any);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", company_name: "", phone: "" });

  const portal = portals[role];

  useEffect(() => {
    document.title = `${lang === "ar" ? portal.titleAr : portal.titleEn} — Kaifan Co-op`;
  }, [role, lang, portal]);

  // Redirect already-signed-in users to their portal
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { primary } = await fetchCurrentUserRoles();
        navigate(pathForRole(primary), { replace: true });
      } catch (error) {
        console.error("Failed to redirect by role", error);
      }
    })();
  }, [user, navigate]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const onSelectRole = (r: PortalRole) => {
    setRole(r);
    setTab("signin");
    const next = new URLSearchParams(params);
    next.set("role", r);
    next.delete("mode");
    setParams(next, { replace: true });
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email, password: parsed.data.password,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم تسجيل الدخول" : "Signed in");
    if (data.session) {
      const { primary } = await fetchCurrentUserRoles(data.session.access_token);
      navigate(pathForRole(primary), { replace: true });
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.full_name,
          company_name: parsed.data.company_name,
          phone: parsed.data.phone,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم إنشاء الحساب" : "Account created");
    navigate("/dashboard");
  };

  const PortalIcon = portal.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 md:py-14 flex items-start justify-center">
        <div className="w-full max-w-3xl">
          {/* Portal selector */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
            {(Object.keys(portals) as PortalRole[]).map((r) => {
              const p = portals[r];
              const Icon = p.icon;
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSelectRole(r)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors text-xs font-medium ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 hover:bg-secondary/60 text-foreground/80"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-center leading-tight">
                    {lang === "ar" ? p.titleAr.replace("بوابة ", "") : p.titleEn.replace(" Portal", "")}
                  </span>
                </button>
              );
            })}
          </div>

          <Card className="shadow-elegant border-border/60">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-md bg-hero text-primary-foreground flex items-center justify-center mb-2">
                <PortalIcon className="h-6 w-6" />
              </div>
              <CardTitle>{lang === "ar" ? portal.titleAr : portal.titleEn}</CardTitle>
              <CardDescription>{lang === "ar" ? portal.descAr : portal.descEn}</CardDescription>
            </CardHeader>
            <CardContent>
              {!portal.canSignup && (
                <div className="mb-4 rounded-md border border-accent/40 bg-accent/10 p-3 text-sm">
                  {lang === "ar"
                    ? "هذه البوابة محصورة. يرجى استخدام بيانات الاعتماد الصادرة من الإدارة."
                    : "This portal is restricted. Please use credentials issued by management."}
                </div>
              )}
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">{t("auth.signin")}</TabsTrigger>
                  <TabsTrigger value="signup" disabled={!portal.canSignup}>{t("auth.signup")}</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={onSignIn} className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">{t("auth.email")}</Label>
                      <Input id="email" type="email" required value={form.email} onChange={update("email")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password">{t("auth.password")}</Label>
                      <Input id="password" type="password" required value={form.password} onChange={update("password")} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      {loading ? t("auth.processing") : t("auth.signin")}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={onSignUp} className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name">{t("auth.full_name")}</Label>
                      <Input id="full_name" required value={form.full_name} onChange={update("full_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company_name">{t("auth.company")}</Label>
                      <Input id="company_name" required value={form.company_name} onChange={update("company_name")} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="email2">{t("auth.email")}</Label>
                        <Input id="email2" type="email" required value={form.email} onChange={update("email")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">{t("auth.phone")}</Label>
                        <Input id="phone" required value={form.phone} onChange={update("phone")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password2">{t("auth.password")}</Label>
                      <Input id="password2" type="password" required minLength={6} value={form.password} onChange={update("password")} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      {loading ? t("auth.processing") : t("auth.signup")}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
