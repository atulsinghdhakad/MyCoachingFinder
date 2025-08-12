import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, getAuth } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const OTPModal = ({ onClose }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
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

  const setupRecaptcha = async () => {
    try {
      const containerId = 'recaptcha-container';
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('❌ reCAPTCHA container not found in DOM');
        setError('reCAPTCHA container not found.');
        return;
      }
      if (window.recaptchaVerifier) return;

      const resolvedAuth = typeof auth?.app === 'object' ? auth : getAuth();
      if (!resolvedAuth || typeof resolvedAuth.app !== 'object') {
        console.error('❌ Firebase Auth is not initialized correctly.');
        setError('Firebase Auth is not initialized.');
        return;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(resolvedAuth, containerId, {
        size: 'invisible',
        callback: (response) => {
          console.log('✅ reCAPTCHA solved:', response);
        },
        'expired-callback': () => {
          toast.error('reCAPTCHA expired. Please try again.');
        },
      });

      await window.recaptchaVerifier.render();
      console.log('✅ reCAPTCHA rendered successfully');
    } catch (err) {
      console.error('❌ setupRecaptcha error:', err);
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
    if (!isResending) setLoading(true);

    setTimeout(async () => {
      try {
        if (!window.recaptchaVerifier) await setupRecaptcha();

        const confirmationResult = await signInWithPhoneNumber(
          auth,
          `+91${phone}`,
          window.recaptchaVerifier
        );
        setConfirmation(confirmationResult);
        toast.dismiss();
        toast.success('OTP sent successfully 🎉');
        new Audio('/ding.mp3').play().catch(() => {});
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
      setError('OTP verification failed. Please request a new OTP.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      confirmation.confirm(code)
        .then(async (result) => {
          const user = result.user;
          try {
            await setDoc(doc(db, "users", user.uid), {
              phone: user.phoneNumber,
              uid: user.uid,
              provider: "phone",
              createdAt: Timestamp.now(),
            });
            toast.success("OTP verified successfully ✅");
            setError('');
            onClose();
          } catch (err) {
            console.error("Firestore write error:", err);
            setError('Failed to save user data.');
          }
        })
        .catch((error) => {
          console.error("❌ Invalid OTP", error);
          setError('Invalid OTP. Try again.');
        })
        .finally(() => setLoading(false));
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="bg-[#121212] w-80 max-w-full p-6 rounded-xl shadow-xl text-white"
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              {confirmation ? 'Enter OTP' : 'Verify Phone'}
            </h2>
            <button className="text-gray-400 hover:text-white text-sm" onClick={onClose}>✕</button>
          </div>

          {!confirmation ? (
            <>
              <label className="block text-sm text-neutral-400 mb-2">Mobile Number</label>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-md border border-neutral-700">
                  <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" className="w-5 h-4" />
                  <span>+91</span>
                </div>
                <div className="relative flex-1 h-9">
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    className="h-9 w-full bg-neutral-800 text-white text-sm px-3 py-2 rounded-md border border-neutral-700"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onFocus={() => setError('')}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                className="w-full bg-green-500 text-black font-bold py-2 rounded-full hover:bg-green-600"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <label className="block text-sm mb-2">Enter OTP sent to +91{phone}</label>
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
                    className="w-10 h-12 text-center bg-neutral-800 border border-neutral-700 rounded-md text-white"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                className="w-full mt-2 bg-green-500 text-black font-bold py-2 rounded-full hover:bg-green-600"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="mt-3 text-sm text-neutral-400 text-center">
                Resend OTP on:
                <button
                  onClick={async () => {
                    if (resendTimer !== 30) {
                      toast.success("OTP resent successfully 🔁");
                      new Audio('/ding.mp3').play().catch(() => {});
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
            </>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-3 text-center">
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