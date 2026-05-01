import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { usePrimaryRole } from "@/hooks/useUserRoles";
import { pathForRole } from "@/lib/redirectByRole";
import { Globe, LogOut, Menu, X, Briefcase, Users, Store, Handshake, ShieldCheck } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/kaifan-logo.jpeg";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { primary } = usePrimaryRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/#about", label: t("nav.about") },
    { to: "/#board", label: t("nav.board") },
    { to: "/#requirements", label: t("nav.requirements") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Kaifan Co-operative Society" className="h-10 w-auto object-contain" />
          <span className="text-base font-semibold tracking-tight text-primary hidden sm:inline">
            {lang === "ar" ? "جمعية كيفان التعاونية" : "Kaifan Co-operative Society"}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="gap-1.5"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-semibold">{lang === "en" ? "العربية" : "EN"}</span>
          </Button>

          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(pathForRole(primary))}
                className="hidden sm:inline-flex"
              >
                {t("nav.dashboard")}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t("auth.signin")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/auth?role=shareholder")}>
                  <Users className="me-2 h-4 w-4" />
                  {t("nav.shareholder_login")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/auth?role=employee")}>
                  <Briefcase className="me-2 h-4 w-4" />
                  {t("nav.employee_login")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/auth?role=vendor")}>
                  <Store className="me-2 h-4 w-4" />
                  {t("nav.vendor_login")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/auth?role=partner")}>
                  <Handshake className="me-2 h-4 w-4" />
                  {lang === "ar" ? "دخول الشركاء" : "Partner Login"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/auth?role=admin")}>
                  <ShieldCheck className="me-2 h-4 w-4" />
                  {lang === "ar" ? "دخول الإدارة" : "Admin Login"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
