import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onIdTokenChanged, signOut, GoogleAuthProvider } from 'firebase/auth';

// DEPRECATED: Email-based admin checking (replaced by Firebase Custom Claims)
// Keeping only essential fallback emails for transition period
const FALLBACK_ADMIN_EMAILS = [
  'atulsinghdhakad15@gmail.com', // Primary admin
  'admin@coachingfinder.com',
];
const ROLE_HIERARCHY = ['superadmin', 'admin', 'moderator', 'user'];
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [primaryRole, setPrimaryRole] = useState('user');

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      console.log('🔥 AuthContext: Auth state changed, user =', user);
      setLoading(true);

      if (user) {
        try {
          // Get fresh token with custom claims
          const token = await user.getIdToken(true); // Force refresh to get latest claims
          const tokenResult = await user.getIdTokenResult(false);
          
          // Extract custom claims from Firebase token
          const customClaims = tokenResult.claims || {};
          const isAdminClaim = customClaims.admin === true;
          // Normalize roles: support both array and single-role (legacy)
          let roles = [];
          let primaryRole = 'user';
          if (customClaims.superadmin) {
            roles.push('superadmin');
            primaryRole = 'superadmin';
          } else if (customClaims.admin) {
            roles.push('admin');
            primaryRole = 'admin';
          } else if (customClaims.moderator) {
            roles.push('moderator');
            primaryRole = 'moderator';
          } else if (Array.isArray(customClaims.roles) && customClaims.roles.length > 0) {
            roles = customClaims.roles;
            primaryRole = customClaims.roles[0];
          }
          
          // Get user email from multiple sources
          let userEmail = user.email;
          console.log('🔥 AuthContext: Processing user =', {
            uid: user.uid,
            email: user.email,
            customClaims: customClaims
          });
          
          if (!userEmail && user.providerData && user.providerData.length > 0) {
            userEmail = user.providerData[0].email;
            console.log('🔍 AuthContext: Got email from providerData[0] =', userEmail);
          }
          
          // Fallback check for admin status during transition period
          const isAdminByEmail = userEmail && FALLBACK_ADMIN_EMAILS.includes(userEmail);
          
          // Primary: Use Firebase Custom Claims, Fallback: Email allowlist
          const adminStatus = isAdminClaim || isAdminByEmail;
          
          console.log('🔒 AuthContext: Role evaluation =', {
            userEmail,
            isAdminClaim,
            isAdminByEmail,
            roles,
            finalAdminStatus: adminStatus
          });
          
          setIsAdmin(adminStatus);
          setUserRoles(roles);
          setPrimaryRole(primaryRole);

        setCurrentUser({
          uid: user.uid,
          email: userEmail || user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          token,
          customClaims: customClaims, // Include custom claims in user object
          roles: roles,
          primaryRole: primaryRole
        });
        } catch (error) {
          console.error('🔥 AuthContext: Error processing user:', error);
          if (error.code === 'auth/too-many-requests') {
            console.warn('🔥 AuthContext: Rate limited, using existing user data');
            // Don't update state if rate limited, use existing data
            setLoading(false);
            return;
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setUserRoles([]);
      }

      setLoading(false);
    });

    // Reduce token refresh frequency and add error handling
    const refreshInterval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await user.getIdToken(true);
        } catch (error) {
          console.warn('🔥 AuthContext: Token refresh failed:', error);
          if (error.code === 'auth/too-many-requests') {
            console.warn('🔥 AuthContext: Rate limited during token refresh');
            // Skip this refresh cycle if rate limited
            return;
          }
        }
      }
    }, 10 * 60 * 1000); // Increased to 10 minutes to reduce API calls

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    if (currentUser && !loading) {
      // You can safely place any logic here that depends on both being initialized
    }
  }, [currentUser, loading]);

  // Ensure GoogleAuthProvider always requests email scope
  const getGoogleProvider = () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    return provider;
  };

  const logout = () => signOut(auth);

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    return userRoles.includes(role) || (role === 'admin' && isAdmin) || primaryRole === role;
  };

  // Helper function to check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role));
  };

  // Hierarchical RBAC: is user's role >= required role?
  const roleGreaterOrEqual = (targetRole) => {
    const userIdx = ROLE_HIERARCHY.indexOf(primaryRole);
    const targetIdx = ROLE_HIERARCHY.indexOf(targetRole);
    return userIdx >= 0 && targetIdx >= 0 && userIdx <= targetIdx;
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      logout, 
      isAdmin, 
      userRoles,
      hasRole,
      hasAnyRole,
      roleGreaterOrEqual,
      getGoogleProvider,
      primaryRole,
      // Keep FALLBACK_ADMIN_EMAILS for backward compatibility during transition
      ADMIN_EMAILS: FALLBACK_ADMIN_EMAILS 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };