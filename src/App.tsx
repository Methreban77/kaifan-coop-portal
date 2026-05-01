import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/auth/RoleGuard";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import EmployeePortal from "./pages/EmployeePortal.tsx";
import ShareholderPortal from "./pages/ShareholderPortal.tsx";
import PartnerPortal from "./pages/PartnerPortal.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Vendor (existing dashboard) */}
              <Route
                path="/dashboard"
                element={
                  <RoleGuard roles={["vendor", "admin", "procurement_admin"]}>
                    <Dashboard />
                  </RoleGuard>
                }
              />

              <Route
                path="/employee"
                element={
                  <RoleGuard roles={["employee", "manager", "admin", "hr_admin"]}>
                    <EmployeePortal />
                  </RoleGuard>
                }
              />
              <Route
                path="/shareholder"
                element={
                  <RoleGuard roles={["shareholder", "admin", "shareholder_admin"]}>
                    <ShareholderPortal />
                  </RoleGuard>
                }
              />
              <Route
                path="/partner"
                element={
                  <RoleGuard roles={["partner", "admin", "partner_admin"]}>
                    <PartnerPortal />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin"
                element={
                  <RoleGuard
                    roles={["admin", "it_admin", "hr_admin", "procurement_admin", "shareholder_admin", "partner_admin"]}
                  >
                    <AdminDashboard />
                  </RoleGuard>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
