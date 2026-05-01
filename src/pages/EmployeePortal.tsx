import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Construction } from "lucide-react";

export default function EmployeePortal() {
  const { lang } = useI18n();
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase className="h-7 w-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">
            {lang === "ar" ? "بوابة الموظفين" : "Employee Portal"}
          </h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <Construction className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {lang === "ar"
                ? `مرحباً ${user?.email}. الميزات الكاملة (الحضور، الإجازات، الأوفر تايم) قيد البناء.`
                : `Welcome ${user?.email}. Full features (attendance, leave, overtime) coming soon.`}
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
