// import React, { useState, useEffect } from 'react';
// import {
//   signInWithEmailAndPassword,
//   signInWithPopup,
//   sendPasswordResetEmail,
//   signInWithPhoneNumber,
//   RecaptchaVerifier,
//   fetchSignInMethodsForEmail,
//   onAuthStateChanged,
// } from 'firebase/auth';
// import { auth, googleProvider, facebookProvider, db } from '../firebase';
// import { doc, setDoc } from 'firebase/firestore';
// import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
// import { FcGoogle } from 'react-icons/fc';
// import { FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
// import { useAuth } from '../context/AuthContext';

// const LoginPage = () => {
//   const { currentUser, loading } = useAuth();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [otp, setOtp] = useState('');
//   const [message, setMessage] = useState('');
//   const [isOtpSent, setIsOtpSent] = useState(false);
//   const [isPhoneLogin, setIsPhoneLogin] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const from = location.state?.from?.pathname || '/';

//   useEffect(() => {
//     if (currentUser && !currentUser.email && currentUser.phoneNumber) {
//       // This logic is no longer needed as email is now saved to Firestore
//     }
//   }, [currentUser]);

//   if (loading) {
//     return <div>Loading...</div>; // Or a spinner
//   }

//   if (currentUser) {
//     return <Navigate to="/" replace />;
//       }

//   const handleLogin = async () => {
//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//       navigate(from === '/login' ? '/' : from, { replace: true }); // Navigate after successful login
//     } catch (error) {
//       setMessage(error.message);
//     }
//   };

//   const handleGoogleLogin = async () => {
//     try {
//       await signInWithPopup(auth, googleProvider);
//     } catch (error) {
//       setMessage(error.message);
//     }
//   };

//   const handleFacebookLogin = async () => {
//     try {
//       await signInWithPopup(auth, facebookProvider);
//     } catch (error) {
//       if (error.code === 'auth/account-exists-with-different-credential') {
//         const email = error.customData?.email;
//         const methods = await fetchSignInMethodsForEmail(auth, email);
//         setMessage(`⚠️ Account exists using ${methods[0]}. Please use that method first, then link this one from settings.`);
//       } else {
//         setMessage(`Facebook login failed: ${error.message}`);
//       }
//     }
//   };

//   const handleForgotPassword = async () => {
//     try {
//       await sendPasswordResetEmail(auth, email);
//       setMessage('📬 Reset email sent!');
//     } catch (error) {
//       setMessage('❌ Reset email failed.');
//     }
//   };

//   const handlePhoneLogin = async () => {
//     try {
//       window.recaptchaVerifier = new RecaptchaVerifier(
//         'recaptcha-container',
//         { size: 'invisible' },
//         auth
//       );
//       const appVerifier = window.recaptchaVerifier;
//       const confirmationResult = await signInWithPhoneNumber(
//         auth,
//         phoneNumber,
//         appVerifier
//       );
//       window.confirmationResult = confirmationResult;
//       setIsOtpSent(true);
//     } catch (error) {
//       setMessage(`Failed to send OTP: ${error.message}`);
//     }
//   };

//   const handleVerifyOtp = async () => {
//     try {
//       await window.confirmationResult.confirm(otp);
//     } catch (error) {
//       setMessage(`OTP verification failed: ${error.message}`);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 px-4">
//       <div className="backdrop-blur-md bg-white/10 dark:bg-gray-900/20 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
//         <h2 className="text-3xl font-bold text-white text-center mb-6">🌟 Welcome Back</h2>

//         {message && (
//           <div className="mb-4 p-3 text-sm rounded-md text-yellow-200 bg-yellow-500/20 border border-yellow-400">
//             {message}
//           </div>
//         )}

//         {!isOtpSent && !isPhoneLogin ? (
//           <>
//             <input
//               type="email"
//               className="w-full p-3 mb-4 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/30 focus:ring-2 focus:ring-purple-300 focus:outline-none"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//             <div className="relative mb-4">
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/30 focus:ring-2 focus:ring-purple-300 focus:outline-none pr-12"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword((prev) => !prev)}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"
//               >
//                 {showPassword ? <FaEyeSlash /> : <FaEye />}
//               </button>
//             </div>
//             <button onClick={handleLogin} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg mb-3">
//               Login
//             </button>
//             <div className="flex justify-between text-sm text-white/80 mb-4">
//               <button onClick={handleForgotPassword} className="hover:underline">
//                 Forgot password?
//               </button>
//             </div>
//             <div className="text-center text-white/70 mb-3">OR</div>
//             <button onClick={handleGoogleLogin} className="flex items-center justify-center w-full bg-white text-black p-3 rounded-xl shadow hover:bg-gray-100 mb-3">
//               <FcGoogle className="text-2xl mr-2" /> Continue with Google
//             </button>
//             <button onClick={handleFacebookLogin} className="flex items-center justify-center w-full bg-blue-600 text-white p-3 rounded-xl shadow hover:bg-blue-700 mb-3">
//               <FaFacebook className="text-2xl mr-2" /> Continue with Facebook
//             </button>
//             <button onClick={() => setIsPhoneLogin(true)} className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition">
//               Login with Phone
//             </button>
//           </>
//         ) : isPhoneLogin && !isOtpSent ? (
//           <>
//             <input
//               type="tel"
//               className="w-full p-3 mb-4 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/30 focus:ring-2 focus:ring-purple-300 focus:outline-none"
//               placeholder="+91XXXXXXXXXX"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//             />
//             <button onClick={handlePhoneLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 mb-3">
//               Send OTP
//             </button>
//             <button onClick={() => setIsPhoneLogin(false)} className="w-full bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600">
//               Back to Email Login
//             </button>
//           </>
//         ) : (
//           <>
//             <input
//               type="text"
//               className="w-full p-3 mb-4 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/30 focus:ring-2 focus:ring-purple-300 focus:outline-none"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//             />
//             <button onClick={handleVerifyOtp} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700">
//               Verify OTP
//             </button>
//           </>
//         )}

//         <p className="mt-4 text-center text-sm text-white/80">
//           Don’t have an account?{' '}
//           <Link to="/register" className="text-blue-300 hover:underline">Sign up</Link>
//         </p>
//       </div>
//       <div id="recaptcha-container"></div>
//     </div>
//   );
// };

// export default LoginPage;