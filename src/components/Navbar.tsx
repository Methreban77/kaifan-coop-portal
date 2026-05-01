import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { usePrimaryRole } from "@/hooks/useUserRoles";
import { pathForRole } from "@/lib/redirectByRole";
import { Globe, LogOut, Menu, X, ChevronDown, User } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/kaifan-logo.jpeg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { primary } = usePrimaryRole();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const isRTL = lang === "ar";

  const mainLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/#about", label: t("nav.about") },
    { to: "/#board", label: t("nav.board") },
    { to: "/#requirements", label: t("nav.requirements") },
  ];

  const serviceLinks = [
    { to: "/auth?role=vendor", label: t("nav.vendor_portal") },
    { to: "/auth?role=employee", label: t("nav.employee_portal") },
    { to: "/auth?role=shareholder", label: t("nav.shareholder_portal") },
  ];

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    if (to.startsWith("/#")) {
      const id = to.slice(2);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      navigate(to);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[hsl(215,65%,18%)] shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Left in LTR, Right in RTL */}
        <Link
          to="/"
          className={`flex items-center gap-3 ${isRTL ? "order-last" : "order-first"}`}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white p-1">
            <img
              src={logo}
              alt="Kaifan Co-operative Society"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="hidden text-base font-semibold tracking-tight text-white sm:inline">
            {isRTL ? "جمعية كيفان التعاونية" : "Kaifan Co-operative"}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className={`hidden items-center gap-1 lg:flex ${isRTL ? "order-first flex-row-reverse" : "order-none"}`}
        >
          {mainLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => handleNavClick(link.to)}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </button>
          ))}

          {/* Services Dropdown */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto rounded-md bg-transparent px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10">
                  {t("nav.services")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-48 gap-1 p-2">
                    {serviceLinks.map((service) => (
                      <li key={service.to}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => handleNavClick(service.to)}
                            className="block w-full rounded-md px-3 py-2 text-start text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                          >
                            {service.label}
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Contact */}
          <button
            onClick={() => {
              const footer = document.querySelector("footer");
              footer?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            {t("nav.contact")}
          </button>
        </nav>

        {/* Right Side Actions */}
        <div
          className={`flex items-center gap-2 ${isRTL ? "order-first" : "order-last"}`}
        >
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
                aria-label="Toggle language"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold">
                  {lang === "en" ? "EN" : "عربي"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"}>
              <DropdownMenuItem onClick={() => setLang("en")}>
                <span className={lang === "en" ? "font-semibold" : ""}>
                  English
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("ar")}>
                <span className={lang === "ar" ? "font-semibold" : ""}>
                  العربية
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(pathForRole(primary))}
                className="hidden border-[hsl(42,75%,52%)] bg-transparent text-white hover:bg-[hsl(42,75%,52%)] hover:text-[hsl(215,65%,18%)] sm:inline-flex"
              >
                {t("nav.dashboard")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                aria-label="Sign out"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="bg-[hsl(42,75%,52%)] font-semibold text-[hsl(215,65%,18%)] hover:bg-[hsl(42,75%,58%)]"
            >
              <User className="me-1.5 h-4 w-4" />
              {t("auth.signin")}
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[hsl(215,65%,15%)] lg:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {mainLinks.map((link) => (
              <button
                key={link.to}
                onClick={() => handleNavClick(link.to)}
                className="rounded-md px-3 py-2.5 text-start text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </button>
            ))}

            {/* Mobile Services Accordion */}
            <button
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-start text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span>{t("nav.services")}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mobileServicesOpen && (
              <div
                className={`flex flex-col gap-1 ${isRTL ? "pr-4" : "pl-4"}`}
              >
                {serviceLinks.map((service) => (
                  <button
                    key={service.to}
                    onClick={() => handleNavClick(service.to)}
                    className="rounded-md px-3 py-2 text-start text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {service.label}
                  </button>
                ))}
              </div>
            )}

            {/* Contact */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const footer = document.querySelector("footer");
                footer?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-md px-3 py-2.5 text-start text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {t("nav.contact")}
            </button>

            {/* Mobile Dashboard Button */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(pathForRole(primary));
                }}
                className="mt-2 w-full border-[hsl(42,75%,52%)] bg-transparent text-white hover:bg-[hsl(42,75%,52%)] hover:text-[hsl(215,65%,18%)]"
              >
                {t("nav.dashboard")}
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
