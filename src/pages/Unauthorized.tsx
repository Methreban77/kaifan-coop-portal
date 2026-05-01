import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  const { lang } = useI18n();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-14 w-14 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {lang === "ar" ? "غير مصرح" : "Access denied"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {lang === "ar"
              ? "لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة."
              : "You don't have permission to access this page."}
          </p>
          <Button asChild>
            <Link to="/">{lang === "ar" ? "العودة للرئيسية" : "Back to home"}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
