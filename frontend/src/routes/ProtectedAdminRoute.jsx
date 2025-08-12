// src/routes/ProtectedAdminRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { loading, roleGreaterOrEqual } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Require at least 'admin' role
  if (!roleGreaterOrEqual('admin')) {
    return <Navigate to="/adminlogin" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedAdminRoute;