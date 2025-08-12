// src/components/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase'; // Make sure you import your firebase config here
import { onAuthStateChanged } from 'firebase/auth';

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component that provides the user context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listening for authentication state changes and updating the user
    const unsubscribe = onAuthStateChanged(auth, setUser);

    // Cleanup the subscription on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context
export const useAuth = () => useContext(AuthContext);