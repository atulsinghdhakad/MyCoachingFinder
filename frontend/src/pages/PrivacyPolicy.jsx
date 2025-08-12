import React from 'react';
import './PrivacyPolicy.css'; // Import your CSS file for styling
const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>

      <p className="text-lg mb-4">
        Welcome to Coaching Finder! Your privacy is important to us, and this Privacy Policy outlines how we collect, use, and protect your personal information.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
      <p className="text-lg mb-4">
        We may collect personal information such as your name, email address, phone number, and location when you sign up for an account, interact with our services, or use our website.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
      <p className="text-lg mb-4">
        We use the information we collect to improve our services, personalize your experience, and communicate with you about your account and relevant updates.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">3. Data Protection</h2>
      <p className="text-lg mb-4">
        We implement reasonable security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Cookies</h2>
      <p className="text-lg mb-4">
        We may use cookies to enhance your user experience. Cookies are small files stored on your device to remember preferences and provide relevant content.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Your Rights</h2>
      <p className="text-lg mb-4">
        You have the right to access, update, or delete your personal information. If you have any concerns or requests regarding your data, please contact us.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Changes to This Policy</h2>
      <p className="text-lg mb-4">
        We reserve the right to update this Privacy Policy from time to time. Any changes will be reflected on this page.
      </p>

      <p className="text-lg mb-4">
        If you have any questions or concerns about this Privacy Policy, please contact us at [contact@coachingfinder.com].
      </p>
    </div>
  );
};

export default PrivacyPolicy;