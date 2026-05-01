import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, Users, Store, Handshake, Briefcase } from "lucide-react";
import heroImg from "@/assets/hero-supermarket.jpg";
import { PortalsSection } from "@/components/home/PortalsSection";

interface Requirement {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  category: string | null;
  deadline: string | null;
  status: "open" | "closed" | "awarded";
}

const board = [
  { name_en: "Mosaab Ahmed Al-mullah", name_ar: "مصعب أحمد الملا", role: "board.chairman" as const },
  { name_en: "Mohammed Essa Al-saeed", name_ar: "محمد عيسى السعيد", role: "board.vice" as const },
  {
    name_en: "Khaled Abdulrahman Al-Abduljader",
    name_ar: "خالد عبدالرحمن العبدالجادر",
    role: "board.treasurer" as const,
  },
  { name_en: "Majid Abdullah Almutairi", name_ar: "ماجد عبدالله المطيري", role: "board.secretary" as const },
  { name_en: "Bader Helal Al-otaibi", name_ar: "بدر هلال العتيبي", role: "board.member" as const },
  ,
];

export default function Index() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [reqs, setReqs] = useState<Requirement[]>([]);

  useEffect(() => {
    document.title = lang === "ar" ? "جمعية كيفان التعاونية" : "Kaifan Co-operative Society";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      lang === "ar"
        ? "جمعية كيفان التعاونية — تأسست عام 1962. مناقصات للموردين، معلومات للمساهمين والموظفين."
        : "Kaifan Co-operative Society — established 1962. Vendor tenders, shareholder & employee portals.";
    if (meta) meta.setAttribute("content", desc);
  }, [lang]);

  useEffect(() => {
    supabase
      .from("ho_requirements")
      .select("*")
      .eq("status", "open")
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(6)
      .then(({ data }) => setReqs((data as Requirement[]) ?? []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" width={1600} height={900} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-hero opacity-90" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-primary-foreground">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-accent text-accent-foreground hover:bg-accent">
              {t("stats.established")} 1962
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">{t("hero.title")}</h1>
            <p className="mt-5 text-lg md:text-xl text-primary-foreground/85 max-w-2xl">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/auth?role=vendor&mode=signup")}
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-elegant"
              >
                {t("hero.cta_vendor")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("requirements")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10"
              >
                {t("hero.cta_view")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Portals — primary entry points for users */}
      <PortalsSection />

      {/* Stats */}
      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: Calendar, label: t("stats.established"), value: "1962" },
            { icon: Users, label: t("stats.shareholders"), value: "12,400+" },
            { icon: Store, label: t("stats.branches"), value: "8" },
            { icon: Handshake, label: t("stats.vendors"), value: "350+" },
          ].map((s, i) => (
            <Card key={i} className="shadow-card border-border/60">
              <CardContent className="p-4 md:p-5">
                <s.icon className="h-5 w-5 text-primary mb-2" />
                <div className="text-xl md:text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Requirements / Tenders — placed first so vendors see immediately */}
      <section id="requirements" className="container mx-auto px-4 py-16 md:py-20">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("req.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("req.subtitle")}</p>
          </div>
          <Button onClick={() => navigate("/auth?role=vendor&mode=signup")} variant="outline">
            <Briefcase className="me-2 h-4 w-4" />
            {t("hero.cta_vendor")}
          </Button>
        </div>

        {reqs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">{t("req.no_open")}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reqs.map((r) => (
              <Card key={r.id} className="shadow-card hover:shadow-elegant transition-shadow border-border/60">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">{(lang === "ar" && r.title_ar) || r.title}</CardTitle>
                    <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/10">
                      {t("req.status.open")}
                    </Badge>
                  </div>
                  {r.category && <div className="text-xs text-muted-foreground mt-1">{r.category}</div>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {(lang === "ar" && r.description_ar) || r.description}
                  </p>
                  {r.deadline && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("req.deadline")}: {new Date(r.deadline).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")}
                    </div>
                  )}
                  <Button
                    onClick={() => navigate(`/dashboard?req=${r.id}`)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {t("req.submit")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section id="about" className="bg-secondary/30 py-16 md:py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("about.title")}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-base md:text-lg">{t("about.body")}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { v: "50+", l: lang === "ar" ? "سنة من الخدمة" : "Years of Service" },
              { v: "12.4K", l: t("stats.shareholders") },
              { v: "8", l: t("stats.branches") },
              { v: "350+", l: t("stats.vendors") },
            ].map((s, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-5">
                  <div className="text-3xl font-bold text-primary">{s.v}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Board */}
      <section id="board" className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("board.title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("board.subtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {board.map((m, i) => (
            <Card key={i} className="border-border/60 shadow-card text-center">
              <CardContent className="p-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-hero text-primary-foreground flex items-center justify-center text-xl font-bold mb-3">
                  {(lang === "ar" ? m.name_ar : m.name_en)
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="font-semibold">{lang === "ar" ? m.name_ar : m.name_en}</div>
                <div className="text-sm text-muted-foreground">{t(m.role)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
