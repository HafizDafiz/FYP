import { useAuthContext } from '../hooks/useAuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

const Dashboard = () => {
  const { user } = useAuthContext();

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (user.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (user.role === 'staff') {
    return <Navigate to="/staff-dashboard" replace />;
  } else {
    // Fallback for any other roles or undefined role
    return <Navigate to="/staff-dashboard" replace />;
  }
};

export default Dashboard;
