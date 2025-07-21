import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user } = useAuthContext();

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and user doesn't have it, redirect to appropriate dashboard
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/staff-dashboard" replace />;
    }
  }

  // User is authenticated and has the required role (or no specific role required)
  return children;
};

export default ProtectedRoute;
