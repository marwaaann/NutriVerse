import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: response, isLoading, isError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-amber-50/50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-2"></div>
        <p className="font-semibold text-amber-900">Loading NutriVerse...</p>
      </div>
    );
  }

  const user = response;

  if (isError || !user) return <Navigate to="/auth/signin" replace />;

  const onboardingCompleted = user.onboardingCompleted || false;

  if (!onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingCompleted && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}