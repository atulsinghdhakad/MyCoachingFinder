// src/utils/socket.js
import { io } from 'socket.io-client';

// Use environment variable for API URL or fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Singleton socket instance
const adminSocket = io(API_URL, {
  path: '/socket.io', // adjust if your backend uses a custom path
  autoConnect: true,
  transports: ['websocket'], // fallback to polling if needed
  withCredentials: true // if backend requires cookies
});

// Make available globally for legacy code
if (typeof window !== 'undefined') {
  window.adminSocket = adminSocket;
}

export default adminSocket;
