import React, { useState, useEffect } from 'react';
import {  Route, Routes, Navigate } from 'react-router-dom';
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
import AdminLoginPage from './pages/AdminLoginPage';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
// import AdminDebug from './components/AdminDebug';

// Protected Admin Route Component
const ProtectedAdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const adminSession = localStorage.getItem('adminSession') === 'true';

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin || !adminSession) {
    return <Navigate to="/adminlogin" />;
  }

  return children;
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

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
        {/* <AdminDebug /> */}

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

          {/* Admin routes */}
          <Route path="/adminlogin" element={<AdminLoginPage />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          
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