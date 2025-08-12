import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { ADMIN_EMAILS } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify if the user is actually an admin
      if (!ADMIN_EMAILS.includes(user.email)) {
        await auth.signOut(); // Sign out non-admin users
        toast.error('❌ Access Denied: You are not authorized to access Admin Panel!', {
          position: 'top-center',
        });
        return;
      }

      // Set admin session for verified admin users
      localStorage.setItem('adminSession', 'true');
      localStorage.setItem('adminEmail', user.email);
      await user.getIdToken(true);

      toast.success(`🎉 Welcome Admin: ${user.email}`, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: 'linear-gradient(to right, #8e2de2, #4a00e0)',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '16px',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
        },
        icon: '🔒',
      });

      navigate('/adminpanel');
    } catch (error) {
      console.error('Admin login error:', error);
      let errorMessage = 'Login failed!';
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      return toast.error('Please enter your email to reset password.');
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('📬 Password reset link sent to your email.', {
        position: 'top-center',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-center',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700">
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-md bg-white/10 dark:bg-gray-900/30 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="flex justify-center mb-6"
        >
          <img
            src="/logo.png"
            alt="Logo"
            className="h-16"
            onError={(e) => (e.target.style.display = 'none')}
          />
        </motion.div>

        <h2 className="text-3xl font-bold text-white text-center mb-6">🔐 Admin Login</h2>
        
        {/* Admin Info */}
        <div className="mb-6 p-3 bg-white/10 rounded-lg text-white/80 text-sm">
          <p><strong>Admin Emails:</strong></p>
          <ul className="mt-1 text-xs">
            {ADMIN_EMAILS.map(email => (
              <li key={email}>• {email}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs"><strong>Note:</strong> Use your Firebase Auth credentials</p>
        </div>

        <input
          type="email"
          placeholder="Admin Email"
          className="w-full mb-4 p-3 rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative mb-4">
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Admin Password"
            className="w-full p-3 pr-10 rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-3 text-white/70"
          >
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="text-right text-sm mb-6">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-purple-300 hover:text-white transition"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg"
        >
          {loading ? 'Logging in...' : 'Login as Admin'}
        </button>
      </motion.form>
    </div>
  );
};

export default AdminLoginPage;
