// src/components/PhoneAuthModal.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';

const PhoneAuthModal = ({ isOpen, onClose }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    let interval;
    if (showOtpInput && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpInput, timer]);

  // Setup reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  };

  const handleSendOTP = async () => {
    if (!/^[0-9]{10}$/.test(phone)) {
      return setError('Enter a valid 10-digit phone number.');
    }

    setError('');
    setLoading(true);
    setupRecaptcha();

    try {
      const fullPhone = '+91' + phone;
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
      setTimer(60);
    } catch (err) {
      setError('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      return setError('Please enter a valid 6-digit OTP.');
    }

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Store user in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        createdAt: new Date(),
      });

      onClose(); // close modal
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    }
  };

  const handleResend = () => {
    setShowOtpInput(false);
    handleSendOTP();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#121212] p-6 rounded-2xl w-[90%] max-w-md text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <h2 className="text-xl font-semibold mb-4">Continue with Phone</h2>

            {!showOtpInput ? (
              <>
                <label className="block text-sm mb-1">Mobile Number</label>
                <div className="flex items-center border border-gray-700 rounded px-3 py-2 mb-3 bg-[#1e1e1e]">
                  <span className="mr-2 text-gray-400">🇮🇳 +91</span>
                  <input
                    type="tel"
                    maxLength="10"
                    value={phone}
                    onChange={(e) => {
                      if (/^\d{0,10}$/.test(e.target.value)) {
                        setPhone(e.target.value);
                        setError('');
                      }
                    }}
                    className="bg-transparent outline-none flex-1 text-white"
                    placeholder="Enter 10-digit number"
                  />
                </div>
                <button
                  onClick={handleSendOTP}
                  className="w-full bg-green-500 hover:bg-green-600 py-2 rounded font-medium"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm mb-1">Enter OTP</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-gray-700 rounded text-white mb-3"
                  placeholder="6-digit OTP"
                />
                <button
                  onClick={handleVerifyOTP}
                  className="w-full bg-blue-500 hover:bg-blue-600 py-2 rounded font-medium"
                >
                  Verify OTP
                </button>

                <div className="mt-3 text-sm text-center text-gray-400">
                  {timer > 0 ? (
                    <>Resend OTP in {timer}s</>
                  ) : (
                    <button onClick={handleResend} className="text-blue-400 hover:underline">
                      Resend OTP
                    </button>
                  )}
                </div>
              </>
            )}

            {error && (
              <motion.div
                className="mt-3 text-red-400 text-sm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className="mt-4 text-center">
              <button onClick={onClose} className="text-gray-500 text-sm hover:underline">
                Cancel
              </button>
            </div>

            <div id="recaptcha-container"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhoneAuthModal;