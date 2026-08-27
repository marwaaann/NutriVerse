import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useAuth();

  if (isLoading) return <h1>Loading...</h1>;

  if (isError || !user) return <Navigate to="/auth/signin" />;

  return <>{children}</>;
}