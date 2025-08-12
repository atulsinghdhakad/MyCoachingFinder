import React, { useState, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import { FaMobileAlt, FaShieldAlt, FaAsterisk } from 'react-icons/fa';

import { auth } from '../firebase';
import { FcGoogle } from 'react-icons/fc';
import { FiPhone } from 'react-icons/fi';
import { FaApple, FaFacebookF, FaEye, FaEyeSlash } from 'react-icons/fa';
import OTPModal from '../components/OTPModal.jsx';
import logo from '../assets/subscriberiq.png';
import '../assets/fonts/circular.css';
import { logLogin } from '../utils/logLogin';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showReset, setShowReset] = useState(false);
  const emailRef = useRef(null);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const clearErrorAfterDelay = () => {
    setTimeout(() => setErrorMsg(''), 3000);
  };

  const handleEmailBlur = async () => {
    if (!email || !isValidEmail(email)) return;
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        setErrorMsg('No account found with this email.');
        clearErrorAfterDelay();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!email && !password) {
      setErrorMsg('Please enter your email and password.');
      clearErrorAfterDelay();
      setLoading(false);
      return;
    } else if (!email) {
      setErrorMsg('Please enter your email.');
      clearErrorAfterDelay();
      setLoading(false);
      return;
    } else if (!password) {
      setErrorMsg('Please enter your password.');
      clearErrorAfterDelay();
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      clearErrorAfterDelay();
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await logLogin(auth.currentUser, 'password');
      window.location.href = '/dashboard';
    } catch (error) {
      setErrorMsg('Invalid credentials. Please try again.');
      clearErrorAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      setErrorMsg('Enter your email to reset password.');
      clearErrorAfterDelay();
      return;
    }

    if (!isValidEmail(cleanedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      clearErrorAfterDelay();
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, cleanedEmail);
      if (!methods || methods.length === 0) {
        setErrorMsg('No account found with this email.');
      } else if (methods.includes('password')) {
        await sendPasswordResetEmail(auth, cleanedEmail);
        setErrorMsg('✅ Password reset email sent.');
        setShowReset(false);
      } else {
        const providerName = methods.includes('google.com')
          ? 'Google'
          : methods.includes('facebook.com')
          ? 'Facebook'
          : 'another method';
        setErrorMsg(`⚠️ This email is registered via ${providerName}. Please use that method to login.`);
      }
    } catch (error) {
      console.error("Reset error:", error);
      setErrorMsg('⚠️ Failed to send reset email. Try again later.');
    } finally {
      clearErrorAfterDelay();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      const res = await fetch('http://localhost:5000/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      const { exists } = await res.json();

      if (!exists) {
        await logLogin(user, 'google');
        window.location.href = `/set-password?email=${encodeURIComponent(user.email)}`;
      } else {
        await logLogin(user, 'google');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setErrorMsg(error.message);
      clearErrorAfterDelay();
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, new FacebookAuthProvider());
      const user = auth.currentUser;
      await logLogin(user, 'facebook');
      window.location.href = '/dashboard';
    } catch (error) {
      setErrorMsg(error.message);
      clearErrorAfterDelay();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-circular">
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-neutral-900 py-14 px-10 rounded-2xl shadow-2xl flex flex-col items-center animate-fade-in-up">
          <img src={logo} alt="SubscriberIQ" className="h-14 w-64 object-contain mb-6 animate-logo-drop" />

          <div className="space-y-2 w-80 text-base">
            <button onClick={handleGoogleLogin} className="w-full relative flex items-center justify-center border border-neutral-700 text-white py-2.5 px-5 rounded-full hover:border-green-500 transition-all">
              <FcGoogle className="absolute left-5 text-xl" />
              <span>Continue with Google</span>
            </button>

            <button onClick={handleFacebookLogin} className="w-full relative flex items-center justify-center border border-neutral-700 text-white py-2.5 px-5 rounded-full hover:border-green-500 transition-all">
              <span className="absolute left-5 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <FaFacebookF className="text-xs" />
              </span>
              <span>Continue with Facebook</span>
            </button>

            <button onClick={() => alert('Apple Sign-In requires Apple Developer setup.')} className="w-full relative flex items-center justify-center border border-neutral-700 text-white py-2.5 px-5 rounded-full hover:border-green-500 transition-all">
              <FaApple className="absolute left-5 text-xl" />
              <span>Continue with Apple</span>
            </button>

            <button onClick={() => setShowOTPModal(true)} className="w-full relative flex items-center justify-center border border-neutral-700 text-white py-2.5 px-5 rounded-full hover:border-green-500 transition-all">
            <span className="absolute left-5 w-5 h-5 flex items-center justify-center">
  <svg
    viewBox="0 0 70 64"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <defs>
      <linearGradient id="otpGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#9b5cff" />
      </linearGradient>
    </defs>

    <rect x="16" y="8" width="32" height="48" rx="4" stroke="url(#otpGradient)" strokeWidth="2" fill="none" />

    <text x="32" y="40" fontSize="8" fill="#4facfe" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
      OTP
    </text>

    <rect x="44" y="12" width="14" height="10" rx="2" stroke="url(#otpGradient)" strokeWidth="2" fill="none" />
    <text x="47" y="20" fontSize="6" fill="#4facfe" fontFamily="sans-serif">****</text>
  </svg>
</span>


              <span>Continue with Phone Number</span>
            </button>
          </div>

          <div className="border-t border-neutral-700 my-6 w-full"></div>

          <form onSubmit={handleEmailLogin} className="w-80 text-base">
            <label htmlFor="email" className="block text-white mb-1">Email</label>
            <input ref={emailRef} autoFocus id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setErrorMsg('')} onBlur={handleEmailBlur} placeholder="Enter your email" className="w-full px-4 py-3 bg-neutral-800 text-white rounded-full border border-neutral-700 placeholder:text-neutral-400 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500" />

            <label htmlFor="password" className="block text-white mb-1">Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setErrorMsg('')} placeholder="Enter your password" className="w-full px-4 py-3 bg-neutral-800 text-white rounded-full border border-neutral-700 placeholder:text-neutral-400 mb-4 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-neutral-400">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button type="submit" disabled={loading} className={`w-full bg-green-500 text-black font-bold py-3 rounded-full hover:border-green-600 transition-all ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {loading ? (
                <div className="flex justify-center items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Continue'
              )}
            </button>

            <p onClick={() => setShowReset(true)} className="text-sm text-green-400 text-right mt-2 cursor-pointer hover:underline">
              Forgot password?
            </p>
          </form>

          {errorMsg && (
            <div className="mt-4 text-red-500 text-sm animate-pulse text-center max-w-xs">
              {errorMsg}
            </div>
          )}

          <p className="text-base text-neutral-500 mt-6">
            Don&apos;t have an account? <a href="/signup" className="text-white hover:underline">Sign up</a>
          </p>
        </div>
      </div>

      {showOTPModal && <OTPModal onClose={() => setShowOTPModal(false)} />}

      {showReset && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded-lg text-white text-center space-y-4 max-w-sm w-full">
            <h2 className="text-lg font-semibold">Reset your password</h2>
            <p className="text-sm">We will send a reset link to your email.</p>
            <div className="flex space-x-2">
              <button onClick={handleResetPassword} className="bg-green-500 text-black font-bold px-4 py-2 rounded-full w-full">Send Reset Email</button>
              <button onClick={() => setShowReset(false)} className="text-sm text-neutral-400 hover:underline w-full">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;