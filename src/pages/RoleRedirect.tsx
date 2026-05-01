import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePrimaryRole } from "@/hooks/useUserRoles";
import { pathForRole } from "@/lib/redirectByRole";

/**
 * Smart redirector — sends signed-in users to their portal based on role.
 * Routes that previously pointed to /dashboard now hit this and bounce
 * appropriately. Vendors keep the existing vendor dashboard at /vendor.
 */
export default function RoleRedirect() {
  const { user, loading } = useAuth();
  const { primary, isLoading } = usePrimaryRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || isLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    const target = pathForRole(primary);
    // If we're already redirecting to /dashboard (vendor default), render the vendor dashboard inline
    if (target === "/dashboard") return;
    navigate(target, { replace: true });
  }, [user, loading, primary, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
