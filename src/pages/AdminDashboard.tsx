import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { useUserRoles } from "@/hooks/useUserRoles";
import { ShieldCheck } from "lucide-react";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { VendorsAdminTab } from "@/components/admin/VendorsAdminTab";
import { TendersAdminTab } from "@/components/admin/TendersAdminTab";
import { PartnerRequestsAdminTab } from "@/components/admin/PartnerRequestsAdminTab";
import { PartnerProposalsAdminTab } from "@/components/admin/PartnerProposalsAdminTab";
import { PartnerContractsAdminTab } from "@/components/admin/PartnerContractsAdminTab";
import { AuditLogTab } from "@/components/admin/AuditLogTab";
import { ITSettingsTab } from "@/components/admin/ITSettingsTab";

export default function AdminDashboard() {
  const { lang } = useI18n();
  const { data: roles = [] } = useUserRoles();

  const isFullAdmin = roles.includes("admin");
  const isIT = roles.includes("it_admin") || isFullAdmin;
  const canManageUsers = isFullAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {lang === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "الإدارة وتقنية المعلومات" : "Management & IT"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="overview">{lang === "ar" ? "نظرة عامة" : "Overview"}</TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="users">{lang === "ar" ? "المستخدمون" : "Users"}</TabsTrigger>
            )}
            <TabsTrigger value="partners">{lang === "ar" ? "الشركاء" : "Partners"}</TabsTrigger>
            <TabsTrigger value="requests">{lang === "ar" ? "الطلبات" : "Requests"}</TabsTrigger>
            <TabsTrigger value="proposals">{lang === "ar" ? "العروض" : "Proposals"}</TabsTrigger>
            <TabsTrigger value="contracts">{lang === "ar" ? "العقود" : "Contracts"}</TabsTrigger>
            <TabsTrigger value="tenders">{lang === "ar" ? "المناقصات" : "Tenders"}</TabsTrigger>
            {isIT && (
              <>
                <TabsTrigger value="it">{lang === "ar" ? "إعدادات IT" : "IT Settings"}</TabsTrigger>
                <TabsTrigger value="audit">{lang === "ar" ? "سجل التدقيق" : "Audit Log"}</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
          {canManageUsers && (<TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>)}
          <TabsContent value="partners" className="mt-6"><VendorsAdminTab /></TabsContent>
          <TabsContent value="requests" className="mt-6"><PartnerRequestsAdminTab /></TabsContent>
          <TabsContent value="proposals" className="mt-6"><PartnerProposalsAdminTab /></TabsContent>
          <TabsContent value="contracts" className="mt-6"><PartnerContractsAdminTab /></TabsContent>
          <TabsContent value="tenders" className="mt-6"><TendersAdminTab /></TabsContent>
          {isIT && (
            <>
              <TabsContent value="it" className="mt-6"><ITSettingsTab /></TabsContent>
              <TabsContent value="audit" className="mt-6"><AuditLogTab /></TabsContent>
            </>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
