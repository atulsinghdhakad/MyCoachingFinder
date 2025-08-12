// src/routes/ProtectedAdminRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminLogin = () => {
      const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
      setIsAdminLoggedIn(adminLoggedIn);
      setIsLoading(false);
    };

    checkAdminLogin();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    // Silently redirect to admin login without showing error toast
    return <Navigate to="/adminlogin" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;