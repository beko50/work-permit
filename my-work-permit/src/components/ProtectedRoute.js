import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [], requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check if we're on an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Handle admin routes
  if (isAdminRoute || requireAdmin) {
    // If no user or not an admin, redirect to admin login
    if (!user || user.roleId !== 'ADMIN') {
      return <Navigate to="/admin/sign-in" state={{ from: location }} replace />;
    }
  } else {
    // Handle regular user routes
    if (!user) {
      return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.roleId)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};