import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 p-6">
      
      {/* 404 Heading Animation */}
      <motion.h1
        className="text-6xl font-bold text-teal-500 mb-4"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        404
      </motion.h1>

      {/* Subheading Animation */}
      <motion.h2
        className="text-2xl font-semibold mb-2"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Page Not Found
      </motion.h2>

      {/* Paragraph Animation */}
      <motion.p
        className="text-center mb-6 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        Oops! The page you are looking for does not exist or has been moved.
      </motion.p>

      {/* Button Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
      >
        <Link 
          to="/" 
          className="bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 
            hover:bg-teal-600 hover:scale-105 hover:shadow-xl"
        >
          Go Back Home
        </Link>
      </motion.div>

    </div>
  );
};

export default NotFoundPage;