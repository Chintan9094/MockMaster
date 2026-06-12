import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { isTokenExpired } from '../lib/token';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { token, bootstrapped } = useAuthStore();
  const sessionExpired = token && isTokenExpired(token);

  if (!bootstrapped) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Checking your session...</p>
      </div>
    );
  }

  if (!token || sessionExpired) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
