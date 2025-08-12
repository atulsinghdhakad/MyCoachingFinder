import React, { useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAuth } from '../context/AuthContext';

const MySwal = withReactContent(Swal);

const AdminLogin = () => {
  const navigate = useNavigate();
  const { isAdmin, ADMIN_EMAILS } = useAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser && isAdmin) {
        // Removed: set adminSession in localStorage (not secure, not needed)
        navigate('/adminpanel');
      }
    });
    return () => unsubscribe();
  }, [navigate, isAdmin]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (ADMIN_EMAILS.includes(user.email)) {
        // Only set admin session for verified admin users
        // Removed: set adminSession in localStorage (not secure, not needed)
        navigate('/adminpanel');
      } else {
        await auth.signOut(); // Force sign out immediately
        MySwal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You are not authorized to access Admin Panel!',
          confirmButtonColor: '#d33',
          background: '#f9fafb'
        });
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      toast.error('Login failed!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 text-black dark:text-white p-6">
      <h1 className="text-4xl font-bold text-purple-600 mb-6">Admin Login</h1>
      <button
        onClick={handleGoogleLogin}
        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold space-x-3 transition-all"
      >
        <i className="bi bi-google"></i>
        <span>Login with Google</span>
      </button>
    </div>
  );
};

export default AdminLogin;