/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enables dark mode with the 'class' strategy
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        shineGlow: 'shineGlow 4s ease-in-out infinite', // Glowing animation
        pulseGlow: 'pulseGlow 2s infinite', // (Optional) pulsing glow
        'gradient-x': 'gradient-x 5s ease infinite', // Rainbow gradient animation
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite', // Pulsing glow effect
      },
      keyframes: {
        shineGlow: {
          '0%': { backgroundPosition: '-200% 0' },
          '50%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px #00f0ff, 0 0 16px #00f0ff, 0 0 24px #00f0ff' },
          '50%': { boxShadow: '0 0 16px #00f0ff, 0 0 32px #00f0ff, 0 0 48px #00f0ff' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 255, 255, 1)' },
        },
      },
      backgroundImage: {
        glowing: 'linear-gradient(90deg, #ff7e5f, #feb47b, #ff7e5f)', // Smooth animated gradient
      },
      backgroundSize: {
        '200%': '200% 100%', // For background animation
      },
      boxShadow: {
        neon: '0 0 8px #00f0ff, 0 0 16px #00f0ff, 0 0 24px #00f0ff, 0 0 32px #00f0ff', // Neon glowing shadow
      },
    },
  },
  plugins: [],
};