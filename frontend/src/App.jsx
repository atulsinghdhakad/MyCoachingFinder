import React, { useState, useEffect } from 'react';
import {  Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPages from './pages/LoginPages';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import ScrollProgressBar from './pages/ScrollProgressBar';
import NotFoundPage from './pages/NotFoundPage';
import BottomToastNotification from './pages/BottomToastNotification';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ThankYouPage from './pages/ThankYouPage';
import AdminContacts from './pages/AdminContacts';
import AdminPanel from './pages/AdminPanel';
// AdminLoginPage removed - using single auth with RBAC
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminDebug from './components/AdminDebug';
import { initGA, trackPageView } from "./utils/analytics";

// Protected Admin Route Component - Industry Standard RBAC
const ProtectedAdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Show access denied if not admin (determined by Firebase Custom Claims)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have admin privileges to access this area.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};



const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

  useEffect(() => {
    initGA(); // Initialize once
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);


    


  };

  return (
    <>
      <div className={darkMode ? 'dark' : ''}>
        <ScrollProgressBar />
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} toggleDarkMode={toggleDarkMode} />
        
        {/* Debug Component - Temporary */}
        <AdminDebug />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPages />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/thankyou" element={<ThankYouPage />} />
          
          {/* Protected routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes - Protected by RBAC */}
          <Route 
            path="/admin/contacts" 
            element={
              <ProtectedAdminRoute>
                <AdminContacts />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* New admin routes */}
          <Route
            path="/admin/login-logs"
            element={
              <ProtectedAdminRoute>
                <AdminPanel section="login-logs" />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/login-log-stats"
            element={
              <ProtectedAdminRoute>
                <AdminPanel section="login-log-stats" />
              </ProtectedAdminRoute>
            }
          />

          {/* Protected admin routes */}
          <Route
            path="/adminpanel"
            element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Footer />
        <Toaster position="bottom-center" />
        <BottomToastNotification />
      </div>
    </>
  );
};

export default App;