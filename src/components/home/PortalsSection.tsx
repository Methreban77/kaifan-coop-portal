import { Users, Briefcase, Store, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { PortalCard } from "./PortalCard";

export function PortalsSection() {
  const { t, lang } = useI18n();
  return (
    <section id="portals" className="container mx-auto px-4 py-12 md:py-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          {lang === "ar" ? "اختر بوابتك" : "Choose your portal"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {lang === "ar"
            ? "وصول مباشر للخدمة المخصصة لك"
            : "Direct access to the service made for you"}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <PortalCard
          icon={Users}
          title={lang === "ar" ? "المساهمون" : "Shareholders"}
          description={lang === "ar" ? "بوابة المساهمين" : "Shareholder portal"}
          bullets={
            lang === "ar"
              ? ["الأرباح والرصيد", "تحديث البيانات", "حجز المواعيد", "تقديم الشكاوى"]
              : ["Dividends & balance", "Update profile", "Book appointments", "Submit complaints"]
          }
          ctaLabel={lang === "ar" ? "دخول المساهمين" : "Shareholder login"}
          to="/auth?role=shareholder"
          accent="primary"
        />
        <PortalCard
          icon={Briefcase}
          title={lang === "ar" ? "الموظفون" : "Employees"}
          description={lang === "ar" ? "بوابة الموظفين" : "Employee portal"}
          bullets={
            lang === "ar"
              ? ["الحضور والانصراف", "طلبات الإجازة والأوفر تايم", "الطلبات الإدارية", "تقييم الأداء"]
              : ["Attendance check-in/out", "Leave & overtime requests", "Admin requests", "Performance reviews"]
          }
          ctaLabel={lang === "ar" ? "دخول الموظفين" : "Employee login"}
          to="/auth?role=employee"
          accent="success"
        />
        <PortalCard
          icon={Store}
          title={lang === "ar" ? "الموردون" : "Vendors"}
          description={lang === "ar" ? "بوابة الموردين" : "Vendor portal"}
          bullets={
            lang === "ar"
              ? ["عرض المناقصات المفتوحة", "تقديم عروض الأسعار", "أرشيف العروض", "متابعة الحالة"]
              : ["Browse open tenders", "Submit quotations", "Bid archive", "Track status"]
          }
          ctaLabel={lang === "ar" ? "دخول/تسجيل المورد" : "Vendor login / signup"}
          to="/auth?role=vendor"
          accent="accent"
        />
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Handshake className="inline-block h-4 w-4 me-1 align-text-bottom" />
        {lang === "ar" ? "شركة شريكة؟ " : "A partner company? "}
        <Link to="/auth?role=partner" className="text-primary font-medium hover:underline">
          {lang === "ar" ? "دخول الشركاء" : "Partner login"}
        </Link>
      </div>
    </section>
  );
}
