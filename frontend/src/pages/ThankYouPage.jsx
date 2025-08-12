import React from 'react';
import { Link } from 'react-router-dom';

const ThankYouPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white px-4">
      <h1 className="text-4xl font-bold text-purple-600 mb-4">Thank You! 🎉</h1>
      <p className="text-lg mb-6 text-center">
        Your message has been successfully sent. <br /> We will get back to you soon!
      </p>
      <Link
        to="/"
        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
      >
        Go back Home
      </Link>
    </div>
  );
};

export default ThankYouPage;