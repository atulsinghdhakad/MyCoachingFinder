import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

// Admin email configuration - can be moved to environment variables
const ADMIN_EMAILS = [
  'atulsinghdhakad15@gmail.com',
  'admin@coachingfinder.com',
  'test@test.com', // Temporary test email
  'kuwai@gmail.com' // Temporary test email - replace with your actual email
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 AuthContext: Auth state changed');
      console.log('🔍 AuthContext: user =', user);
      
      if (user) {
        // Debug all user properties
        console.log('🔍 AuthContext: user.email =', user.email);
        console.log('🔍 AuthContext: user.providerData =', user.providerData);
        console.log('🔍 AuthContext: user.providerId =', user.providerId);
        console.log('🔍 AuthContext: user.displayName =', user.displayName);
        console.log('🔍 AuthContext: user.uid =', user.uid);
        
        // Try to get email from multiple sources
        let userEmail = user.email;
        
        if (!userEmail && user.providerData && user.providerData.length > 0) {
          userEmail = user.providerData[0].email;
          console.log('🔍 AuthContext: Got email from providerData =', userEmail);
        }
        
        // If still no email, try to get from Firestore
        if (!userEmail) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().email) {
              userEmail = userDoc.data().email;
              console.log('🔍 AuthContext: Got email from Firestore =', userEmail);
            }
          } catch (error) {
            console.log('🔍 AuthContext: Error getting email from Firestore =', error);
          }
        }
        
        console.log('🔍 AuthContext: Final userEmail =', userEmail);
        console.log('🔍 AuthContext: ADMIN_EMAILS =', ADMIN_EMAILS);
        
        setCurrentUser(user);
        
        // Check if user is admin
        if (userEmail) {
          const adminStatus = ADMIN_EMAILS.includes(userEmail);
          setIsAdmin(adminStatus);
          console.log('✅ AuthContext: userEmail =', userEmail);
          console.log('✅ AuthContext: isAdmin =', adminStatus);
          console.log('✅ AuthContext: Email found in admin list =', adminStatus);
        } else {
          // Temporary admin override for testing - remove this in production
          const tempAdminOverride = localStorage.getItem('tempAdminOverride') === 'true';
          if (tempAdminOverride) {
            setIsAdmin(true);
            console.log('🔧 TEMP ADMIN OVERRIDE: Setting isAdmin = true for testing');
          } else {
            setIsAdmin(false);
            console.log('❌ AuthContext: No email found for user');
            console.log('❌ AuthContext: Setting isAdmin = false');
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        console.log('❌ AuthContext: No user logged in');
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  console.log('🔄 AuthContext: Rendering with currentUser =', currentUser);
  console.log('🔄 AuthContext: isAdmin =', isAdmin);
  console.log('🔄 AuthContext: loading =', loading);

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, isAdmin, ADMIN_EMAILS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);