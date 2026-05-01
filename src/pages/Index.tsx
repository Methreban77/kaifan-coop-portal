import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, Users, Store, Handshake, Briefcase, Mail, MessageCircle, Instagram } from "lucide-react";
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


      {/* Contact */}
      <section id="contact" className="bg-secondary/30 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {lang === "ar" ? "تواصل معنا" : "Contact Us"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {lang === "ar"
                ? "نحن هنا للمساعدة — تواصل معنا عبر أي من القنوات التالية"
                : "We're here to help — reach us through any of the channels below"}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {/* WhatsApp */}
            <a
              href="https://wa.me/96566828833"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border border-border/60 bg-background shadow-card hover:shadow-elegant hover:-translate-y-1 transition-all duration-200"
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "hsl(142 60% 94%)" }}>
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="hsl(142 65% 35%)">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {lang === "ar" ? "واتساب" : "WhatsApp"}
                </div>
                <div className="text-sm text-muted-foreground mt-1 dir-ltr" dir="ltr">+965 6682 8833</div>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:kaifan_coop@kaifancoop.net"
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border border-border/60 bg-background shadow-card hover:shadow-elegant hover:-translate-y-1 transition-all duration-200"
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "hsl(215 60% 94%)" }}>
                <Mail className="h-7 w-7" style={{ color: "hsl(215 65% 35%)" }} />
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                </div>
                <div className="text-sm text-muted-foreground mt-1 break-all" dir="ltr">kaifan_coop@kaifancoop.net</div>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/kaifan_coop_q8"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border border-border/60 bg-background shadow-card hover:shadow-elegant hover:-translate-y-1 transition-all duration-200"
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "hsl(330 60% 94%)" }}>
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="hsl(330 65% 45%)">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Instagram
                </div>
                <div className="text-sm text-muted-foreground mt-1" dir="ltr">@kaifan_coop_q8</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
