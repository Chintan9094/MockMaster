import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { token, bootstrapped } = useAuthStore();

  if (!bootstrapped) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Checking your session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
