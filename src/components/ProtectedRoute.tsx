import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Loader from './loader/Loader';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  roles?: string[];
  children?: ReactNode;
}

const ProtectedRoute = ({ roles, children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) return <Loader />;

  if (!isAuthenticated) return <Navigate to="/iniciar_sesion" replace />;

  if (roles && roles.length > 0 && !roles.includes(role ?? '')) return <Navigate to="/" replace />;

  return children ?? <Outlet />;
};

export default ProtectedRoute;
