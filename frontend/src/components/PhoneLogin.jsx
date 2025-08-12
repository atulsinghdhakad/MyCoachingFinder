import React, { useState, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import OTPModal from './OTPModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function PhoneLogin() {
  const [phone, setPhone] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('Recaptcha verified');
        },
      });
      window.recaptchaVerifier.render();
    }
  };

  const sendOTP = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(phone)) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    setupRecaptcha();
    setLoading(true);
    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier);
      setConfirmationResult(result);
      setModalOpen(true);
      setTimeout(() => {
        toast.success('OTP sent to your number!');
      }, 200);
    } catch (error) {
      console.error('OTP error:', error);
      alert('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Phone input with 🇮🇳 flag emoji */}
      <div className="flex items-stretch h-12 border border-gray-300 rounded-lg w-full bg-white overflow-hidden">
        <div className="flex items-center px-3 bg-gray-50 border-r border-gray-200">
          <span role="img" aria-label="India flag" className="text-xl mr-2">🇮🇳</span>
          <span className="text-gray-700 font-medium">+91</span>
        </div>
        <input
          type="tel"
          maxLength={10}
          pattern="[0-9]*"
          placeholder="Enter your phone"
          className="flex-1 px-3 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
        />
      </div>

      <button
        onClick={sendOTP}
        disabled={loading}
        className={`w-full mt-4 py-2 rounded-full font-semibold ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Sending OTP…
          </span>
        ) : 'Continue with Phone'}
      </button>

      <div id="recaptcha-container" ref={recaptchaRef}></div>

      {modalOpen && confirmationResult && (
        <OTPModal
          phone={phone}
          confirmationResult={confirmationResult}
          closeModal={() => setModalOpen(false)}
          onLoginSuccess={() => navigate('/dashboard')}
        />
      )}
    </>
  );
}