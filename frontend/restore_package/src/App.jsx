import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import './App.css'; // Ensure global styles
import 'bootstrap-icons/font/bootstrap-icons.css';
import Footer from './components/Footer'; // Import Footer component
import ScrollToTopButton from './pages/ScrollToTop';  // Import ScrollToTop component
import { Toaster } from 'react-hot-toast';
import ScrollProgressBar from './pages/ScrollProgressBar';
import NotFoundPage from './pages/NotFoundPage'; // Import NotFoundPage component
import BottomToastNotification from './pages/BottomToastNotification';
import PrivacyPolicy from './pages/PrivacyPolicy'; // Import PrivacyPolicy component
import ThankYouPage from './pages/ThankYouPage';
import AdminContacts from './pages/AdminContacts'; // Import AdminContacts component
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel'; // Import AdminPanel component
import { auth } from './firebase';  // Adjust the path if needed
import { Navigate } from 'react-router-dom';  // Add this import






const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Check localStorage for dark mode preference on load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


//Admin route
const PrivateRoute = ({ element, ...rest }) => {
  const user = auth.currentUser; // Or your preferred authentication method
  
  return user ? <Navigate to="/admin" /> : <Navigate to="/login" />;
};







  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <>
    <Router>
      {/* Dark mode toggle applied globally to the root element */}
      <div className={darkMode ? 'dark' : ''}>
      <ScrollProgressBar />
      <ScrollToTopButton/>  
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} toggleDarkMode={toggleDarkMode} />
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/thankyou" element={<ThankYouPage />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/adminlogin" element={<AdminLogin />} />
          
          
          {/* Admin - Protected Route */}
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly={true}>
            </PrivateRoute>
          }
        />


        {/* Admin Panel protected route */}
      <Route
        path="/adminpanel"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminPanel />
          </PrivateRoute>
        }
      />
        
        </Routes>
        <Footer />
        <ScrollToTopButton />
        
      </div>
      
    </Router>
    <Toaster position="bottom-center" /> {/* Optional: Place toasts at bottom */}
      <BottomToastNotification />
    </>
    
  );
};

export default App;
