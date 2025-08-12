

import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase'; // adjust path if needed
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import socket from '../socket'; // adjust path if needed



const getOtpLimitInfo = (phone) => {
  const raw = localStorage.getItem(`otp_${phone}`);
  return raw ? JSON.parse(raw) : { count: 0, cooldownUntil: null };
};

const setOtpLimitInfo = (phone, info) => {
  localStorage.setItem(`otp_${phone}`, JSON.stringify(info));
};

const isCooldownActive = (cooldownUntil) => {
  return cooldownUntil && Date.now() < new Date(cooldownUntil).getTime();
};



const OTPModal = ({ onClose }) => {
    // useEffect(() => {
    //     if (!window.firebase || !window.firebase.auth) {
    //       window.firebase = require('firebase/compat/app');
    //       require('firebase/compat/auth');
    //     }
    //   }, []);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [cooldownTimer, setCooldownTimer] = useState(0);
useEffect(() => {
  const interval = setInterval(() => {
    const otpInfo = getOtpLimitInfo(phone);
    if (isCooldownActive(otpInfo.cooldownUntil)) {
      const secondsLeft = Math.floor((new Date(otpInfo.cooldownUntil).getTime() - Date.now()) / 1000);
      setCooldownTimer(secondsLeft);
    } else {
      setCooldownTimer(0);
      if (otpInfo.count >= 3) {
        setOtpLimitInfo(phone, { count: 0, cooldownUntil: null });
      }
    }
  }, 1000);
  return () => clearInterval(interval);
}, [phone]);
  const recaptchaRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const setupRecaptcha = () => {
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      console.error("reCAPTCHA container not found in DOM.");
      setError('Failed to initialize reCAPTCHA (container missing).');
      return;
    }

    // ✅ REUSE existing verifier if already created
    if (window.recaptchaVerifier) {
      console.log('ℹ️ reCAPTCHA already exists, reusing it.');
      return;
    }

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('✅ reCAPTCHA solved:', response);
        },
        'expired-callback': () => {
          console.warn('⚠️ reCAPTCHA expired. Please try again.');
        },
      });

      window.recaptchaVerifier.render()
        .then(() => {
          console.log('✅ reCAPTCHA rendered');
        })
        .catch((e) => {
          console.error('reCAPTCHA render error:', e);
        });
    } catch (error) {
      console.error('❌ setupRecaptcha error:', error);
      setError('Failed to initialize reCAPTCHA.');
    }
  };

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier?.clear) {
        window.recaptchaVerifier.clear();
      }
      window.recaptchaVerifier = null;
    };
  }, []);


  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit number');
      return;
    }

    const otpInfo = getOtpLimitInfo(phone);

    if (isCooldownActive(otpInfo.cooldownUntil)) {
      const minutes = Math.ceil((new Date(otpInfo.cooldownUntil).getTime() - Date.now()) / 60000);
      setError(`Too many attempts. Try again in ${minutes} minutes.`);
      return;
    }

    if (otpInfo.count >= 3) {
      if (!isCooldownActive(otpInfo.cooldownUntil)) {
        const cooldownUntil = new Date(Date.now() + 10 * 60 * 1000);
        setOtpLimitInfo(phone, { count: 3, cooldownUntil });
      }
      return;
    }

    if (!isResending) {
      setLoading(true);
    }
    setTimeout(async () => {
      try {
        await setupRecaptcha();
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          `+91${phone}`,
          window.recaptchaVerifier
        );
        setConfirmation(confirmationResult);
        const newCount = otpInfo.count + 1;
        setOtpLimitInfo(phone, { count: newCount, cooldownUntil: null });
        socket.emit("otp-sent", { phone });
        socket.once("otp-sent-confirmation", (data) => {
          console.log("✅ Server confirmed OTP sent:", data);
          toast.custom((t) => (
            <div className="bg-green-700 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium animate-fade-in">
              Real-time: OTP successfully sent!
            </div>
          ));
        });
        toast.dismiss(); // Clear any previous toasts
        toast.custom((t) => (
          <div className="bg-[#1f1f1f] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-purple-600 animate-fade-in">
            <span className="text-sm font-medium">OTP sent successfully 🎉</span>
          </div>
        ));
        const ding = new Audio('/ding.mp3');
        ding.play().catch(() => {});
        setResendTimer(30);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to send OTP. Try again.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter 6-digit OTP');
      return;
    }
    if (!confirmation) {
      console.error("confirmationResult is undefined");
      setError('OTP verification failed. Please request a new OTP.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      confirmation.confirm(code)
        .then(async (result) => {
          const user = result.user;
          socket.emit("otp-verified", { uid: user.uid });
          socket.once("otp-verified-confirmation", (data) => {
            console.log("✅ Server confirmed OTP verified:", data);
            toast.custom((t) => (
              <div className="bg-green-800 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium animate-fade-in">
                Real-time: OTP verification confirmed!
              </div>
            ));
          });
          console.log("User UID:", user.uid, "Phone:", user.phoneNumber);
          console.log("✅ OTP Verified", user);
          try {
            await setDoc(doc(db, "users", user.uid), {
              phone: user.phoneNumber,
              uid: user.uid,
              provider: "phone",
              createdAt: Timestamp.now(),
            });
            console.log("✅ User stored in Firestore");
            toast.custom((t) => (
              <div className="bg-purple-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
                <span className="text-lg">✅</span>
                <span className="text-sm font-medium">OTP verified successfully!</span>
              </div>
            ));
            setError('');
            onClose();
          } catch (err) {
            console.error("❌ Firestore write error:", err);
            setError('Failed to save user data. Try again.');
          }
        })
        .catch((error) => {
          console.error("❌ Invalid OTP", error);
          setError('Invalid OTP. Try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-[#121212] w-80 max-w-full p-6 rounded-xl shadow-xl text-white"
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              {confirmation ? 'Enter OTP' : 'Verify Phone'}
            </h2>
            <button
              className="text-gray-400 hover:text-white text-sm"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {!confirmation ? (
            <>
              <label className="block text-sm text-neutral-400 mb-2">Mobile Number</label>
              <div className="flex items-center gap-2 mb-4">
  {/* Flag + +91 box */}
  <div className="flex items-center gap-1 bg-neutral-800 text-white text-sm px-2 py-1 rounded-md border border-neutral-700 hover:border-green-500 transition-all">
    <img
      src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
      alt="Indian Flag"
      className="w-5 h-4 object-cover"
    />
    <span>+91</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-1 h-3 text-white opacity-60"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>

  {/* Phone number input */}
  <div className="relative flex-1 h-9">
    <input
      type="tel"
      maxLength={10}
      inputMode="numeric"
      className="h-9 bg-neutral-800 text-white text-sm px-3 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 hover:border-green-500 focus:border-green-500 focus:outline-none transition-all"
      placeholder="Enter 10-digit number"
      value={phone}
      onChange={(e) =>
        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
      }
      onFocus={() => setError('')}
    />
  </div>
</div>

              <button
                onClick={handleSendOTP}
                className="w-full bg-green-500 text-black font-bold py-2 rounded-full hover:bg-green-600 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </button>
            </>
          ) : (
            <>
              <label className="block text-sm mb-2">
                Enter OTP sent to +91{phone}
              </label>

              <div className="flex justify-between gap-2 mb-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (inputRefs.current[i] = el)}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-10 h-12 text-center text-white bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    id={`otp-${i}`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                className="w-full mt-2 bg-green-500 text-black font-bold py-2 rounded-full hover:bg-green-600 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="mt-3 text-sm text-neutral-400 text-center">
                Resend OTP on:
                <button
                  onClick={async () => {
                    if (resendTimer !== 30) {
                      toast.dismiss();
                      toast.custom((t) => (
                        <div className="bg-[#1f1f1f] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-green-600 animate-fade-in">
                          <span className="text-sm font-medium">OTP resent successfully 🔁</span>
                        </div>
                      ));
                      const ding = new Audio('/ding.mp3');
                      ding.play().catch(() => {});
                    }
                    setIsResending(true);
                    await handleSendOTP();
                    setIsResending(false);
                  }}
                  disabled={resendTimer > 0}
                  className="ml-1 font-semibold text-green-400 hover:underline disabled:opacity-50"
                >
                  SMS {resendTimer > 0 && `(in ${resendTimer}s)`}
                </button>
              </div>
              {cooldownTimer > 0 && (
                <div className="mt-2 text-sm text-yellow-400 text-center">
                  Too many attempts. Try again in {Math.floor(cooldownTimer / 60)}m {cooldownTimer % 60}s
                </div>
              )}
            </>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-3 text-center"
            >
              {error}
            </motion.div>
          )}

          <div id="recaptcha-container" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OTPModal;
