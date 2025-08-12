import React, { useState, useEffect } from 'react';
import { ArrowUpCircleIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      setIsVisible(scrollTop > windowHeight / 2);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={isVisible ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <button
        onClick={scrollToTop}
        className="group bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 ease-in-out relative overflow-hidden"
      >
        <span className="absolute inset-0 bg-white opacity-10 rounded-full blur-lg animate-pulse"></span>
        <ArrowUpCircleIcon className="w-8 h-8 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
      </button>
    </motion.div>
  );
};

export default ScrollToTopButton;