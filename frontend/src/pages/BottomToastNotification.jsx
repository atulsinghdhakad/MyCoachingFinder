import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
// import dingSound from './sounds/ding.mp3'; // Adjust the path to your sound file

const BottomToastNotification = () => {
  const hasShownToast = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize the sound
    audioRef.current = new Audio('/sounds/ding.mp3'); // Adjust path if needed

    // Log audio status for debugging
    audioRef.current.oncanplaythrough = () => {
      console.log('Audio is ready to play');
    };
    audioRef.current.onerror = (err) => {
      console.error('Error loading audio:', err);
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const atBottom = windowHeight + scrollTop >= documentHeight - 10;

      // Trigger the toast and sound only once when the bottom is reached
      if (atBottom && !hasShownToast.current) {
        console.log('At the bottom, playing sound...');
        // Play sound
        audioRef.current.play().catch((e) => console.log('Error playing sound:', e));

        // Show toast with custom styling
        toast.success('🎉 You have reached the bottom!', {
          duration: 1000, // Toast disappears after 1 second
          position: 'bottom-center',
          style: {
            background: 'linear-gradient(to right, #4e6ef0, #6f50c4)', // Gradient background
            color: 'white',
            padding: '6px 12px', // Smaller padding for compact toast
            borderRadius: '8px', // Rounded corners
            fontSize: '14px', // Smaller font size
            fontWeight: '600', // Bold text
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', // Soft shadow for depth
          },
          className: 'animate-toastSlideUp', // Slide-up animation
        });

        hasShownToast.current = true; // Prevent showing the toast multiple times until scroll away
      } else if (!atBottom && hasShownToast.current) {
        // Reset the state when the user scrolls away from the bottom
        hasShownToast.current = false;
      }
    };

    // Attach scroll event listener
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll); // Cleanup on unmount
  }, []);

  return null; // No visible UI, just toast logic
};

export default BottomToastNotification;