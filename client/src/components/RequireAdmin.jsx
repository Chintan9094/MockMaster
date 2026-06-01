import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RequireAdmin({ children }) {
  const { user, bootstrapped, token } = useAuthStore();

  if (!bootstrapped) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
