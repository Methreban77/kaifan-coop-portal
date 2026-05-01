import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isTransientDatabaseError, withSupabaseRetry } from "@/lib/supabaseRetry";
import { Handshake, Inbox, FileSignature, Bell, Building2, ScrollText } from "lucide-react";
import { PartnerRegistrationForm } from "@/components/partner/PartnerRegistrationForm";
import { PartnerRequestsList } from "@/components/partner/PartnerRequestsList";
import { PartnerProposalsList } from "@/components/partner/PartnerProposalsList";
import { PartnerContractsList } from "@/components/partner/PartnerContractsList";
import type { PartnerStatus } from "@/lib/partnerHelpers";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function PartnerPortal() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<PartnerStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [statusRetryKey, setStatusRetryKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setStatusLoading(true);
      setStatusError(false);
      const nRes = await withSupabaseRetry(() =>
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      );
      if (!cancelled) setNotifs((nRes.data as Notification[]) ?? []);

      const { data: prof, error: profError } = await withSupabaseRetry(() =>
        supabase
          .from("partner_profiles")
          .select("approval_status")
          .eq("partner_id", user.id)
          .maybeSingle(),
      );
      if (!cancelled) {
        if (profError && isTransientDatabaseError(profError)) {
          setStatusError(true);
          window.setTimeout(() => {
            if (!cancelled) setStatusRetryKey((key) => key + 1);
          }, 5000);
        } else {
          setApprovalStatus((prof as { approval_status: PartnerStatus } | null)?.approval_status ?? "pending");
          setStatusLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user, statusRetryKey]);

  const unread = notifs.filter((n) => !n.read).length;
  const canSubmit = approvalStatus === "active";

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifs((arr) => arr.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Handshake className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {lang === "ar" ? "بوابة الشركاء التجاريين" : "Business Partner Portal"}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="requests" className="gap-1.5">
              <Inbox className="h-3.5 w-3.5" />
              {lang === "ar" ? "الطلبات المتاحة" : "Available Requests"}
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-1.5">
              <ScrollText className="h-3.5 w-3.5" />
              {lang === "ar" ? "عروضي" : "My Proposals"}
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-1.5">
              <FileSignature className="h-3.5 w-3.5" />
              {lang === "ar" ? "العقود" : "Contracts"}
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {lang === "ar" ? "بيانات الشركة" : "Company"}
            </TabsTrigger>
            <TabsTrigger value="notifs" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              {lang === "ar" ? "الإشعارات" : "Notifications"}
              {unread > 0 && <Badge className="bg-accent text-accent-foreground h-5 px-1.5">{unread}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            {statusError && (
              <Card className="mb-4 border-accent/40 bg-accent/5">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  {lang === "ar"
                    ? "يتم إعادة الاتصال بقاعدة البيانات. ستظهر الطلبات عند اكتمال الاتصال."
                    : "Reconnecting to the database. Requests will update when the connection is ready."}
                </CardContent>
              </Card>
            )}
            <PartnerRequestsList canSubmit={canSubmit} approvalLoading={statusLoading} />
          </TabsContent>

          <TabsContent value="proposals" className="mt-6">
            <PartnerProposalsList />
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
            <PartnerContractsList />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <PartnerRegistrationForm />
          </TabsContent>

          <TabsContent value="notifs" className="mt-6">
            {notifs.length === 0 ? (
              <Card><CardContent className="p-10 text-center text-muted-foreground">
                {lang === "ar" ? "لا توجد إشعارات" : "No notifications"}
              </CardContent></Card>
            ) : (
              <>
                {unread > 0 && (
                  <div className="mb-3 flex justify-end">
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all as read"}
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {notifs.map((n) => (
                    <Card key={n.id} className={n.read ? "border-border/60" : "border-accent/40 bg-accent/5"}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium">{n.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
