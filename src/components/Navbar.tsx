import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { usePrimaryRole } from "@/hooks/useUserRoles";
import { pathForRole } from "@/lib/redirectByRole";
import {
  Globe, LogOut, Menu, X, Briefcase, Users, Store,
  Handshake, ShieldCheck, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import logo from "@/assets/kaifan-logo.jpeg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ─── colour tokens (navy / gold) ──────────────────────────────────────────────
const NAV_BG   = "hsl(215 65% 15%)";   // deep navy
const NAV_GOLD = "hsl(42 75% 52%)";    // warm gold accent

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { primary } = usePrimaryRole();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === "ar";

  // Close services dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/#about", label: t("nav.about") },
    { href: "/#board", label: t("nav.board") },
    { href: "/#requirements", label: t("nav.tenders") },
  ];

  const serviceLinks = [
    { to: "/auth?role=vendor",      icon: Store,      label: t("nav.services.vendor") },
    { to: "/auth?role=employee",    icon: Briefcase,  label: t("nav.services.employee") },
    { to: "/auth?role=shareholder", icon: Users,      label: t("nav.services.shareholder") },
  ];

  const signInLinks = [
    { role: "vendor",      icon: Store,      label: t("nav.vendor_login") },
    { role: "employee",    icon: Briefcase,  label: t("nav.employee_login") },
    { role: "shareholder", icon: Users,      label: t("nav.shareholder_login") },
    { role: "partner",     icon: Handshake,  label: lang === "ar" ? "دخول الشركاء" : "Partner Login" },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        background: NAV_BG,
        boxShadow: "0 2px 24px hsl(215 65% 10% / 0.55)",
      }}
      className="sticky top-0 z-50 w-full"
    >
      {/* ── Top gold accent line ── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${NAV_GOLD}, hsl(38 80% 62%), ${NAV_GOLD})` }} />

      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0 group"
          onClick={() => setMobileOpen(false)}
        >
          <img
            src={logo}
            alt="Kaifan Co-operative Society"
            className="h-10 w-auto object-contain rounded-sm ring-1 ring-white/20 group-hover:ring-amber-400/60 transition-all duration-200"
          />
          <span
            className="hidden sm:block text-sm font-bold leading-tight tracking-wide"
            style={{ color: "hsl(42 75% 72%)" }}
          >
            {isRTL ? "جمعية كيفان التعاونية" : "Kaifan Co-operative"}
          </span>
        </Link>

        {/* ── Desktop Navigation ───────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1">
          {mainLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white rounded-md transition-colors duration-150 group"
            >
              {link.label}
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-3/4 transition-all duration-200 rounded-full"
                style={{ background: NAV_GOLD }}
              />
            </a>
          ))}

          {/* Services dropdown */}
          <div ref={servicesRef} className="relative">
            <button
              onClick={() => setServicesOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white rounded-md transition-colors duration-150 group"
              aria-expanded={servicesOpen}
            >
              {t("nav.services")}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
              />
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-3/4 transition-all duration-200 rounded-full"
                style={{ background: NAV_GOLD }}
              />
            </button>

            {servicesOpen && (
              <div
                className={`absolute top-full mt-2 w-52 rounded-xl overflow-hidden shadow-2xl border border-white/10 ${isRTL ? "right-0" : "left-0"}`}
                style={{ background: "hsl(215 65% 13%)" }}
              >
                {serviceLinks.map(({ to, icon: Icon, label }) => (
                  <button
                    key={to}
                    onClick={() => { navigate(to); setServicesOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" style={{ color: NAV_GOLD }} />
                    {label}
                  </button>
                ))}
                <div className="border-t border-white/10 px-4 py-3">
                  <button
                    onClick={() => { navigate("/auth?role=partner"); setServicesOpen(false); }}
                    className={`w-full flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Handshake className="h-4 w-4 shrink-0" style={{ color: NAV_GOLD }} />
                    {isRTL ? "بوابة الشركاء" : "Partner Portal"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contact */}
          <a
            href="/#contact"
            className="relative px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white rounded-md transition-colors duration-150 group"
          >
            {t("nav.contact")}
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-3/4 transition-all duration-200 rounded-full"
              style={{ background: NAV_GOLD }}
            />
          </a>
        </nav>

        {/* ── Right actions ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-white/70 hover:text-white border border-white/15 hover:border-white/35 transition-all duration-150"
            aria-label="Switch language"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "العربية" : "EN"}
          </button>

          {/* Auth area */}
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(pathForRole(primary))}
                className="hidden sm:inline-flex text-white/80 hover:text-white hover:bg-white/10 text-xs h-8"
              >
                {t("nav.dashboard")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 px-4 text-xs font-bold rounded-full border-0 transition-all duration-150 hover:scale-105 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${NAV_GOLD}, hsl(38 80% 60%))`,
                    color: NAV_BG,
                  }}
                >
                  {t("nav.signin")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isRTL ? "start" : "end"}
                className="w-56 rounded-xl shadow-2xl border border-border/60"
              >
                {signInLinks.map(({ role, icon: Icon, label }) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => navigate(`/auth?role=${role}`)}
                    className={isRTL ? "flex-row-reverse" : ""}
                  >
                    <Icon className="h-4 w-4 me-2" />
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/auth?role=admin")}
                  className={isRTL ? "flex-row-reverse" : ""}
                >
                  <ShieldCheck className="h-4 w-4 me-2" />
                  {isRTL ? "دخول الإدارة" : "Admin Login"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Hamburger */}
          <button
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-white/10"
          style={{ background: "hsl(215 65% 13%)" }}
        >
          <nav className="container mx-auto flex flex-col py-2 px-4">
            {mainLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${isRTL ? "text-right" : "text-left"}`}
              >
                {link.label}
              </a>
            ))}

            {/* Mobile Services */}
            <div className="mt-1">
              <p
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${isRTL ? "text-right" : "text-left"}`}
                style={{ color: NAV_GOLD }}
              >
                {t("nav.services")}
              </p>
              {serviceLinks.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => { navigate(to); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: NAV_GOLD }} />
                  {label}
                </button>
              ))}
              <button
                onClick={() => { navigate("/auth?role=partner"); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Handshake className="h-4 w-4 shrink-0" style={{ color: NAV_GOLD }} />
                {isRTL ? "بوابة الشركاء" : "Partner Portal"}
              </button>
            </div>

            {/* Contact */}
            <a
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors mt-1 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("nav.contact")}
            </a>

            {/* Mobile dashboard/signout */}
            {user && (
              <div className="border-t border-white/10 mt-2 pt-2 flex gap-2 px-1">
                <button
                  onClick={() => { navigate(pathForRole(primary)); setMobileOpen(false); }}
                  className="flex-1 py-2 text-sm text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  {t("nav.dashboard")}
                </button>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="px-3 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
