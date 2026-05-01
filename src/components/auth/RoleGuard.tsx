import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, type AppRole } from "@/hooks/useUserRoles";
import { Loader2 } from "lucide-react";

interface Props {
  roles: AppRole[];
  children: ReactNode;
  fallback?: string;
}

export function RoleGuard({ roles, children, fallback = "/auth" }: Props) {
  const { user, loading } = useAuth();
  const { data: userRoles, isLoading, isError } = useUserRoles();
  const location = useLocation();

  if (loading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallback} state={{ from: location.pathname }} replace />;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-lg font-semibold">تعذّر الاتصال بقاعدة البيانات</p>
        <p className="text-sm text-muted-foreground max-w-md">
          الخادم يستجيب ببطء أو يُعيد التشغيل. يرجى الانتظار لحظات ثم تحديث الصفحة.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const allowed = (userRoles ?? []).some((r) => roles.includes(r));
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
