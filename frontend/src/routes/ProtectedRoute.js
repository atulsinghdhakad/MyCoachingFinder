// 📁 File: src/routes/ProtectedRoute.js

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Wait for auth context to initialize
    if (currentUser !== undefined) {
      setCheckingAuth(false);
    }
  }, [currentUser]);

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading secure content...
      </div>
    );
  }

  if (!currentUser || !currentUser.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !currentUser.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
