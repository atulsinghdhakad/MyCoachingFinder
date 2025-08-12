import axios from 'axios';

export const logLogin = async (user) => {
  try {
    await axios.post('/api/auth/log-login', {
      uid: user.uid,
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      provider: user.providerData[0]?.providerId || 'unknown',
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      createdAt: user.metadata?.creationTime || null,
      lastLoginAt: user.metadata?.lastSignInTime || new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log login:', err);
  }
};