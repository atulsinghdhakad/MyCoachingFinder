import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase'; // adjust path if needed
import { RecaptchaVerifier, signInWithPhoneNumber, getAuth } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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
  const recaptchaRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const [isResending, setIsResending] = useState(false);
  const [recaptchaSetupTime, setRecaptchaSetupTime] = useState(null);
  const [otpSendCount, setOtpSendCount] = useState(0);
  const [cooldownStart, setCooldownStart] = useState(null);

  // Load OTP send count and cooldown from server and reset error/count for current phone only
  useEffect(() => {
    const fetchOtpMeta = async () => {
      if (!/^[6-9]\d{9}$/.test(phone)) return;
      try {
        const res = await axios.post('/api/otp/attempt-meta', {
          phone: `+91${phone}`,
        });
        const { count, cooldownStart: serverCooldown } = res.data || {};
        const now = Date.now();
        if (serverCooldown) {
          const cooldownTime = new Date(serverCooldown).getTime();
          if (now - cooldownTime >= 10 * 60 * 1000) {
            setOtpSendCount(0);
            setCooldownStart(null);
            setError('');
          } else {
            setOtpSendCount(count || 0);
            setCooldownStart(cooldownTime);
            // Set resendTimer based on remaining cooldown
            const remaining = Math.ceil((10 * 60 * 1000 - (now - cooldownTime)) / 1000);
            setResendTimer(remaining > 0 ? remaining : 0);
            if ((count || 0) >= 3) {
              setError('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
            } else {
              setError('');
            }
          }
        } else {
          setOtpSendCount(count || 0);
          setCooldownStart(null);
          setError('');
        }
      } catch (err) {
        console.warn('Could not fetch OTP attempt meta from server:', err);
        setOtpSendCount(0);
        setCooldownStart(null);
        setError('');
      }
    };

    fetchOtpMeta();
  }, [phone]);

  // On modal mount, hydrate state from localStorage (phone, cooldown, send count)
  useEffect(() => {
    const savedPhone = localStorage.getItem('otpPhone');
    if (savedPhone) {
      setPhone(savedPhone);
      // hydrate resendTimer from lastOtpTimestamp if within 10 mins
      const now = Date.now();
      const lastOtp = localStorage.getItem('lastOtpTimestamp');
      if (lastOtp && now - Number(lastOtp) <= 10 * 60 * 1000) {
        const remaining = Math.ceil((10 * 60 * 1000 - (now - Number(lastOtp))) / 1000);
        setResendTimer(remaining);
      }
    }
    const savedCooldown = localStorage.getItem('cooldownStart');
    const savedCount = localStorage.getItem('otpSendCount');
    if (savedCooldown) setCooldownStart(Number(savedCooldown));
    if (savedCount) setOtpSendCount(Number(savedCount));
    // Restore resendTimer if in cooldown and send count exceeded
    if (savedCooldown && savedCount >= 3) {
      const remaining = Math.ceil((10 * 60 * 1000 - (Date.now() - Number(savedCooldown))) / 1000);
      if (remaining > 0) {
        setResendTimer(remaining);
      } else {
        setOtpSendCount(0);
        setCooldownStart(null);
        localStorage.removeItem('cooldownStart');
        localStorage.removeItem('otpSendCount');
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Run reCAPTCHA v3 and return token (for backend verification)
  const runRecaptchaV3 = async (action = 'send_otp') => {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        return reject('reCAPTCHA v3 not loaded');
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute('6LdwPJcrAAAAAErqEEOBTne1r65z6u3NhrFastpl', { action: 'send_otp' })
          .then((token) => resolve(token))
          .catch((err) => reject(err));
      });
    });
  };

  const setupRecaptcha = async () => {
    try {
      const containerId = 'recaptcha-container';
      const container = document.getElementById(containerId);

      if (!container) {
        console.error('❌ reCAPTCHA container not found in DOM');
        setError('reCAPTCHA container not found.');
        return;
      }

      // Clear the container's contents to avoid duplicate rendering error without affecting React's DOM refs
      container.innerHTML = '';

      // Clear any existing verifier
      if (window.recaptchaVerifier?.clear) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Error clearing recaptchaVerifier:", e);
        }
      }

      window.recaptchaVerifier = null;

      const resolvedAuth = getAuth();
      if (!resolvedAuth || typeof resolvedAuth !== 'object' || !resolvedAuth.app) {
        console.error('❌ Firebase Auth is not initialized correctly.');
        setError('Firebase Auth is not initialized.');
        return;
      }

      // Now create new verifier on the fresh container
      window.recaptchaVerifier = new RecaptchaVerifier(resolvedAuth, containerId, {
        size: 'invisible',
        callback: async (response) => {
          console.log('✅ reCAPTCHA solved:', response);
        },
        'expired-callback': () => {
          toast.error('reCAPTCHA expired. Please try again.');
        }
      });

      const widgetId = await window.recaptchaVerifier.render();
      if (typeof widgetId !== 'number') {
        throw new Error('Invalid reCAPTCHA widget ID');
      }

      window.recaptchaVerifier.widgetId = widgetId;
      setRecaptchaSetupTime(Date.now());
      console.log('✅ reCAPTCHA rendered with widget ID:', widgetId);
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


  const handleSendOTP = async (isResend = false) => {
    console.log('📤 Send OTP clicked', { isResend });

    // Inserted logic: OTP max attempts based on lastOtpTimestamp
    const lastOtp = parseInt(localStorage.getItem('lastOtpTimestamp') || '0');
    if (!isResend && otpSendCount >= 3 && Date.now() - lastOtp < 10 * 60 * 1000) {
      setError('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      toast.error('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      return;
    }

    // Guard clause: if not a resend, and limit reached & cooldown active, block sending
    if (
      !isResend &&
      otpSendCount >= 3 &&
      cooldownStart &&
      Date.now() - cooldownStart < 10 * 60 * 1000
    ) {
      const remaining = Math.ceil((10 * 60 * 1000 - (Date.now() - cooldownStart)) / 1000);
      setResendTimer(remaining > 0 ? remaining : 0);
      setError('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      toast.error('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      return;
    }

    // NEW GUARD: block if count >= 3 and cooldown in localStorage is active
    const now = Date.now();
    const savedCooldown = Number(localStorage.getItem('cooldownStart'));
    if (otpSendCount >= 3 && savedCooldown && now - savedCooldown < 10 * 60 * 1000) {
      const remaining = Math.ceil((10 * 60 * 1000 - (now - savedCooldown)) / 1000);
      setResendTimer(remaining);
      setError('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      toast.error('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      return;
    }

    if (otpSendCount >= 3 && cooldownStart && Date.now() - cooldownStart < 10 * 60 * 1000) {
      setError('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      toast.error('🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit number');
      return;
    }

    if (!isResend) setLoading(true);

    setTimeout(async () => {
      try {
        // --- reCAPTCHA v3 scoring and fallback logic ---
        let fallbackToV2 = false;
        try {
          const token = await runRecaptchaV3();
          const scoreResponse = await fetch('/api/recaptcha/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, action: 'send_otp' }),
          });
          const { score } = await scoreResponse.json();
          console.log('reCAPTCHA v3 score:', score);
          if (score < 0.5) {
            console.warn("Low reCAPTCHA v3 score. Falling back to v2 invisible...");
            await setupRecaptcha();
            fallbackToV2 = true;
          }
        } catch (err) {
          // If v3 fails, fallback to v2
          console.warn("reCAPTCHA v3 failed, falling back to v2:", err);
          await setupRecaptcha();
          fallbackToV2 = true;
        }

        const now = Date.now();
        const shouldResetRecaptcha =
          !window.recaptchaVerifier ||
          typeof window.recaptchaVerifier.verify !== 'function' ||
          (recaptchaSetupTime && now - recaptchaSetupTime > 10 * 60 * 1000); // 10 minutes

        if (shouldResetRecaptcha && !fallbackToV2) {
          if (window.recaptchaVerifier?.clear) {
            window.recaptchaVerifier.clear();
          }
          window.recaptchaVerifier = null;
          await setupRecaptcha();
        }
        let confirmationResult;
        try {
          confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
        } catch (e) {
          console.warn("Retrying reCAPTCHA render due to failure");
          await setupRecaptcha();
          confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
        }
        setConfirmation(confirmationResult);
        // Store the last OTP timestamp in localStorage
        localStorage.setItem('lastOtpTimestamp', Date.now().toString());
        // After logging OTP attempt, optionally update resend count in MongoDB here if needed
        setOtpSendCount((prev) => {
          const newCount = prev + 1;
          localStorage.setItem('otpSendCount', newCount.toString());
          if (newCount >= 3) {
            const now = Date.now();
            setCooldownStart(now);
            localStorage.setItem('cooldownStart', now.toString());
          }
          return newCount;
        });
        // If send count hits 3 exactly now, set cooldownStart immediately to ensure timer starts reliably
        if (otpSendCount + 1 >= 3) {
          const now = Date.now();
          setCooldownStart(now);
          localStorage.setItem('cooldownStart', now.toString());
        }
        // Show toast only if not exceeding limit (use current count + 1)
        if (otpSendCount + 1 < 3) {
          toast.custom(() => (
            <div className={`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border ${isResend ? 'border-yellow-500' : 'border-purple-600'} animate-fade-in`}>
              <span className="text-sm font-medium">
                {isResend ? 'OTP resent successfully 🔁' : 'OTP sent successfully 🎉'}
              </span>
            </div>
          ));
        }
        const ding = new Audio('/ding.mp3');
        ding.play().catch(() => {});
        setResendTimer(otpSendCount + 1 >= 3 ? 600 : 30);
        setError('');
        // Log OTP resend/send on backend
        try {
          await fetch('/api/otp/resend-log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: `+91${phone}`,
              timestamp: new Date().toISOString(),
              // Remove `ip` key entirely from the request body, so server can auto-extract it
              userAgent: navigator.userAgent,
            }),
          });
        } catch (err) {
          console.error('Failed to log resend attempt:', err);
        }
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
    const lastOtpTimestamp = parseInt(localStorage.getItem('lastOtpTimestamp') || '0');
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - lastOtpTimestamp > tenMinutes) {
      setError('OTP expired. Please request a new one.');
      return;
    }
    // 🔒 TODO: Track abuse attempts using IP/device on backend (rate limit, ban, etc.)
    setLoading(true);
    setTimeout(() => {
      confirmation.confirm(code)
        .then(async (result) => {
          const user = result.user;
          console.log("User UID:", user.uid, "Phone:", user.phoneNumber);
          console.log("✅ OTP Verified", user);
          try {
            await setDoc(doc(db, "users", user.uid), {
              phone: user.phoneNumber,
              uid: user.uid,
              provider: "phone",
              createdAt: Timestamp.now(),
            });
            setLoading(true);
            toast.custom((t) => (
              <div className="bg-purple-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
                <span className="text-lg">✅</span>
                <span className="text-sm font-medium">Logged in successfully!</span>
              </div>
            ));
            await new Promise((res) => setTimeout(res, 1000)); // allow toast to show
            window.location.replace('/');
            // This will not run after redirect but added for safety
            setLoading(false);
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

  // Effect to clear cooldown and reset counters after 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (cooldownStart && otpSendCount >= 3) {
        const elapsed = Date.now() - cooldownStart;
        if (elapsed >= 10 * 60 * 1000) {
          setOtpSendCount(0);
          setCooldownStart(null);
          localStorage.removeItem('cooldownStart');
          localStorage.removeItem('otpSendCount');
          localStorage.removeItem('lastOtpTimestamp');
          setResendTimer(0);
          setError('');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownStart, otpSendCount]);

  // Effect to sync resendTimer if user reopens modal and cooldown is active
  useEffect(() => {
    const cooldown = Number(localStorage.getItem('cooldownStart'));
    if (cooldown && otpSendCount >= 3) {
      const elapsed = Date.now() - cooldown;
      const remaining = Math.ceil((10 * 60 * 1000 - elapsed) / 1000);
      if (remaining > 0) {
        setResendTimer(remaining);
      }
    }
  }, []);

  return (
    <AnimatePresence>
      <section role="dialog" aria-modal="true" aria-labelledby="otp-modal-heading">
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#121212] w-80 max-w-full p-6 rounded-xl shadow-xl text-white min-h-[270px]"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
          >
            <h2 id="otp-modal-heading" className="sr-only">Phone Number OTP Login</h2>
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
  <div className="flex items-center gap-1 h-9 bg-neutral-800 text-white text-sm px-2 rounded-md border border-neutral-700 hover:border-green-500 transition-all">
    <img
      src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
      alt="Indian Flag"
      className="w-5 h-4 object-cover"
    />
    <span>+91</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3 h-3 text-white opacity-60"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>

  {/* Phone number input */}
      <div className="relative flex-1">
        <input
          type="tel"
          maxLength={10}
          inputMode="numeric"
          className="h-9 bg-neutral-800 text-white text-sm px-3 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 hover:border-green-500 focus:border-green-500 focus:outline-none transition-all"
          placeholder="Enter 10-digit number"
          value={phone}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
            setPhone(cleaned);
            setError('');
            // Persist phone number in localStorage
            localStorage.setItem('otpPhone', cleaned);
            // Also persist lastOtpTimestamp, otpSendCount, cooldownStart for this phone
            // (preserves across reloads/close)
            // Don't reset send count or cooldown if phone is the same
          }}
          onFocus={() => setError('')}
        />
      </div>
</div>

              <button
                onClick={() => handleSendOTP(false)}
                className="w-full bg-green-500 text-black font-bold py-2 rounded-full hover:bg-green-600 transition-all"
                disabled={
                  loading ||
                  (!confirmation &&
                    otpSendCount >= 3 &&
                    cooldownStart &&
                    Date.now() - cooldownStart < 10 * 60 * 1000)
                }
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
              {(otpSendCount >= 3 && cooldownStart && Date.now() - cooldownStart < 10 * 60 * 1000) && (
                <p className="text-red-400 text-sm mt-2 text-center">
                  🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.
                </p>
              )}
            </>
          ) : (
            <>
              <label className="block text-sm mb-2">
                Enter OTP sent to +91{phone}
              </label>

              <div className="flex justify-between gap-2 mb-2">
                {otp.map((digit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <input
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
                  </motion.div>
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
                    setIsResending(true);
                    await handleSendOTP(true);
                    setIsResending(false);
                  }}
                  disabled={resendTimer > 0 || (otpSendCount >= 3 && cooldownStart && Date.now() - cooldownStart < 10 * 60 * 1000)}
                  className="ml-1 font-semibold text-green-400 hover:underline disabled:opacity-50"
                >
                  SMS {resendTimer > 0 && `(in ${resendTimer}s)`}
                </button>
                {(otpSendCount >= 3 && cooldownStart && Date.now() - cooldownStart < 10 * 60 * 1000) && (
                  <p className="text-red-400 text-sm mt-2 text-center">
                    🚫 You’ve reached the maximum OTP attempts. Try again after 10 minutes.
                  </p>
                )}
              </div>
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
      </section>
    </AnimatePresence>
  );
};


export default OTPModal;