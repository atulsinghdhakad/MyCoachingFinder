// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { motion } from 'framer-motion';

const MySwal = withReactContent(Swal);

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // 🔐 Hardcoded credentials
    const ADMIN_EMAIL = 'admin@coachingfinder.com';
    const ADMIN_PASSWORD = 'admin1234';

    setLoggingIn(true);

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        navigate('/admin/panel');
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Invalid Credentials',
          text: 'The email or password you entered is incorrect.',
          confirmButtonColor: '#7C3AED',
          background: '#fefefe'
        });
      }
      setLoggingIn(false);
    }, 800); // Simulate login delay
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <motion.div
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-600 flex items-center justify-center space-x-2">
          <i className="bi bi-shield-lock-fill"></i>
          <span>Admin Login</span>
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 flex justify-center items-center"
          >
            {loggingIn ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              'Login as Admin'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
