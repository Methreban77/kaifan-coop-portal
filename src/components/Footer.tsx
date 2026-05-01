import { useI18n } from "@/lib/i18n";
import { MapPin, Mail, Phone } from "lucide-react";
import logo from "@/assets/kaifan-logo.jpeg";

export function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img
              src={logo}
              alt="Kaifan Co-operative Society"
              className="h-12 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            {lang === "ar"
              ? "نخدم مجتمع كيفان منذ عام 1962."
              : "Serving the Kaifan community since 1962."}
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t("footer.contact")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {t("footer.address")}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +965 0000 0000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> it@kaifancoop.net
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">
            {lang === "ar" ? "روابط" : "Links"}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#about" className="hover:text-primary">
                {t("nav.about")}
              </a>
            </li>
            <li>
              <a href="#board" className="hover:text-primary">
                {t("nav.board")}
              </a>
            </li>
            <li>
              <a href="#requirements" className="hover:text-primary">
                {t("nav.requirements")}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4">
        <p className="container mx-auto px-4 text-xs text-muted-foreground text-center">
          {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
