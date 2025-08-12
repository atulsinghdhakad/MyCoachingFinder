import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { auth } from '../firebase';
import { 
  updatePassword, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  linkWithCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './SettingsPage.css';

const MySwal = withReactContent(Swal);

const SettingsPage = () => {
  console.log('🔧 SettingsPage: Component rendering');
  
  const { user, logout, setUser, navigateTo, goBack, addToNavigationStack } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    },
    preferences: {
      darkMode: false,
      language: 'en',
      timezone: 'UTC'
    }
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showPasswordResetInfo, setShowPasswordResetInfo] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const navigate = useNavigate();
  const userEmail = user?.email || user?.providerData?.[0]?.email || null;

  const ADMIN_EMAILS = ['atulsinghdhakad15@gmail.com'];

  useEffect(() => {
    console.log('🔧 SettingsPage: Component mounted');
    console.log('🔧 SettingsPage: Auth context user:', user);
    console.log('🔧 SettingsPage: Current pathname:', window.location.pathname);
    
    // Add current page to navigation stack
    if (window.location.pathname === '/settings') {
      console.log('🔧 SettingsPage: Adding /settings to navigation stack');
      // Use a small delay to ensure the stack is ready
      setTimeout(() => {
        addToNavigationStack('/settings');
      }, 100);
    }
    
    // Don't redirect immediately if user is null, wait a bit for context to load
    if (user) {
      console.log('🔧 SettingsPage: User authenticated:', user.email);
      setLoading(false);
    } else if (user === null) {
      // User is null, but wait a bit before redirecting to allow context to load
      console.log('🔧 SettingsPage: User is null, waiting for context to load...');
      setLoading(true);
      
      // Wait 2 seconds for context to load before redirecting
      const timer = setTimeout(() => {
        console.log('🔧 SettingsPage: Context load timeout, checking user again');
        if (!user && window.location.pathname !== '/login') {
          console.log('🔧 SettingsPage: User still null after timeout, redirecting to login');
          setLoading(false);
          window.location.href = '/login';
        } else if (user) {
          console.log('🔧 SettingsPage: User loaded after timeout, staying on settings');
          setLoading(false);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      // User is undefined (still loading), keep loading state
      console.log('🔧 SettingsPage: User is undefined (still loading)');
      setLoading(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      console.log('SettingsPage: user.email =', user.email);
      console.log('SettingsPage: isAdmin =', ADMIN_EMAILS.some(admin => admin.toLowerCase().trim() === (user.email || '').toLowerCase().trim()));
    }
  }, [user]);

  const isAdmin = user && ADMIN_EMAILS.some(admin => admin.toLowerCase().trim() === (user.email || '').toLowerCase().trim());
  const isAdminLoggedIn = isAdmin;

  // Load settings from localStorage and user context when component mounts
  useEffect(() => {
    if (user?.uid) {
      // First try to get settings from user context (which loads from localStorage on auth)
      if (user.settings) {
        setSettings(user.settings);
        console.log('🔧 SettingsPage: Loaded settings from user context:', user.settings);
      } else {
        // Fallback to localStorage if not in context
        const savedSettings = localStorage.getItem(`settings_${user.uid}`);
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            setSettings(parsedSettings);
            console.log('🔧 SettingsPage: Loaded settings from localStorage:', parsedSettings);
          } catch (error) {
            console.error('🔧 SettingsPage: Error parsing saved settings:', error);
          }
        }
      }
    }
  }, [user?.uid, user?.settings]);

  // Load 2FA state from localStorage
  useEffect(() => {
    if (user?.uid) {
      const twoFA = localStorage.getItem(`2fa_${user.uid}`);
      setTwoFactorEnabled(twoFA === 'true');
    }
  }, [user?.uid]);

  // Detect Google user without password provider (automated)
  useEffect(() => {
    if (
      user &&
      userEmail &&
      user.providerData.some((p) => p.providerId === 'google.com') &&
      !user.providerData.some((p) => p.providerId === 'password')
    ) {
      setShowSessionModal(true);
    } else {
      setShowSessionModal(false);
    }
  }, [user, userEmail]);

  // Show set password modal only on first Google login without password provider
  useEffect(() => {
    if (
      user &&
      userEmail &&
      user.providerData.some((p) => p.providerId === 'google.com') &&
      !user.providerData.some((p) => p.providerId === 'password') &&
      !localStorage.getItem(`password_linked_${user.uid}`)
    ) {
      setShowSetPasswordModal(true);
    } else {
      setShowSetPasswordModal(false);
    }
  }, [user, userEmail]);

  const handleSettingChange = (category, setting, value) => {
    console.log('🔧 SettingsPage: Setting changed:', category, setting, value);
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    };
    setSettings(newSettings);
    
    // Save to localStorage and update user context
    if (user?.uid) {
      localStorage.setItem(`settings_${user.uid}`, JSON.stringify(newSettings));
      setUser(currentUser => ({
        ...currentUser,
        settings: newSettings
      }));
      console.log('🔧 SettingsPage: Settings saved to localStorage and context');
      
      // Sync with backend
      fetch('http://localhost:5001/api/users/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          settings: newSettings
        }),
      }).catch(error => {
        console.error('Error syncing settings with backend:', error);
      });
    }
  };

  const handleSaveSettings = () => {
    console.log('🔧 SettingsPage: Saving settings:', settings);
    
    // Save to localStorage and update user context
    if (user?.uid) {
      localStorage.setItem(`settings_${user.uid}`, JSON.stringify(settings));
      setUser(currentUser => ({
        ...currentUser,
        settings: settings
      }));
      console.log('🔧 SettingsPage: Settings saved to localStorage and context');
      
      // Sync with backend
      fetch('http://localhost:5001/api/users/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          settings: settings
        }),
      }).then(() => {
        console.log('🔧 SettingsPage: Settings synced with backend');
      }).catch(error => {
        console.error('Error syncing settings with backend:', error);
      });
    }
    
    // Here you would typically save to a database
    toast.success('Settings saved successfully! ⚙️', {
      style: {
        background: 'linear-gradient(to right, #667eea, #764ba2)',
        color: '#fff',
        fontWeight: 'bold',
      },
    });
  };

  // Handle Two-Factor Authentication
  const handleEnable2FA = async () => {
    setIsEnabling2FA(true);
    try {
      const result = await MySwal.fire({
        title: twoFactorEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication',
        text: twoFactorEnabled ? 'Are you sure you want to disable 2FA?' : 'Are you sure you want to enable 2FA? (Simulated)',
        icon: twoFactorEnabled ? 'warning' : 'info',
        showCancelButton: true,
        confirmButtonText: twoFactorEnabled ? 'Disable' : 'Enable',
        cancelButtonText: 'Cancel',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
      });
      if (result.isConfirmed) {
        localStorage.setItem(`2fa_${user.uid}`, (!twoFactorEnabled).toString());
        setTwoFactorEnabled(!twoFactorEnabled);
        toast.success(twoFactorEnabled ? '2FA Disabled' : '2FA Enabled');
      }
    } finally {
      setIsEnabling2FA(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      if (!userEmail) {
        toast.error('Cannot change password: missing email. You will be signed out. Please sign in again.');
        await logout();
        window.location.href = '/login';
        return;
      }
      const { value: formValues } = await MySwal.fire({
        title: '🔐 Change Password',
        html: `
          <input id="swal-input1" class="swal2-input" placeholder="Current Password" type="password">
          <input id="swal-input2" class="swal2-input" placeholder="New Password" type="password">
          <input id="swal-input3" class="swal2-input" placeholder="Confirm New Password" type="password">
        `,
        focusConfirm: false,
        preConfirm: () => {
          const currentPassword = document.getElementById('swal-input1').value;
          const newPassword = document.getElementById('swal-input2').value;
          const confirmPassword = document.getElementById('swal-input3').value;
          
          if (!currentPassword || !newPassword || !confirmPassword) {
            Swal.showValidationMessage('Please fill in all fields');
            return false;
          }
          
          if (newPassword !== confirmPassword) {
            Swal.showValidationMessage('New passwords do not match');
            return false;
          }
          
          if (newPassword.length < 6) {
            Swal.showValidationMessage('Password must be at least 6 characters');
            return false;
          }
          
          return { currentPassword, newPassword };
        },
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
      });

      if (formValues) {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(userEmail, formValues.currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, formValues.newPassword);
        
        toast.success('Password changed successfully! 🔐', {
          style: {
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            fontWeight: 'bold',
          },
        });
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to change password. ' + (error?.message || ''));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async () => {
    try {
      const result = await MySwal.fire({
        title: '📧 Reset Password',
        text: 'We will send a password reset link to your email address.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Send Reset Link',
        cancelButtonText: 'Cancel',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
      });
      if (result.isConfirmed) {
        if (!userEmail) {
          toast.error('Cannot reset password: missing email. You will be signed out. Please sign in again.');
          await logout();
          window.location.href = '/login';
          return;
        }
        await sendPasswordResetEmail(auth, userEmail);
        toast.success('Password reset link sent to your email! Please sign out and sign in again with your new password.', {
          style: {
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            fontWeight: 'bold',
          },
        });
        setShowPasswordResetInfo(true);
      }
    } catch (error) {
      toast.error('Failed to send reset link. ' + (error?.message || ''));
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      if (!userEmail) {
        toast.error('Cannot delete account: missing email. You will be signed out. Please sign in again.');
        await logout();
        window.location.href = '/login';
        return;
      }
      // For Google users, re-authenticate with Google popup
      if (isGoogleUser) {
        try {
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(user, provider);
        } catch (reauthError) {
          toast.error('Google re-authentication failed. Please try again.');
          setIsDeletingAccount(false);
          return;
        }
      }
      const result = await MySwal.fire({
        title: '⚠️ Delete Account',
        text: 'This action cannot be undone. All your data will be permanently deleted.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete My Account',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        color: '#fff',
      });
      if (result.isConfirmed) {
        const { value: password } = await MySwal.fire({
          title: '🔐 Confirm Password',
          input: 'password',
          inputLabel: 'Enter your password to confirm deletion',
          inputPlaceholder: 'Your password',
          showCancelButton: true,
          confirmButtonText: 'Delete Account',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#d33',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          color: '#fff',
          inputValidator: (value) => {
            if (!value) {
              return 'You need to enter your password!';
            }
          }
        });
        if (password) {
          const credential = EmailAuthProvider.credential(userEmail, password);
          await reauthenticateWithCredential(user, credential);
          await deleteUser(user);
          localStorage.clear();
          sessionStorage.clear();
          toast.success('Account deleted successfully. Goodbye! 👋');
          window.location.href = '/';
        }
      }
    } catch (error) {
      toast.error('Failed to delete account. ' + (error?.message || ''));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Handle Download Data
  const handleDownloadData = async () => {
    console.log('🔧 SettingsPage: Downloading data...');
    
    try {
      const userData = {
        email: userEmail,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        creationTime: user.metadata?.creationTime,
        lastSignInTime: user.metadata?.lastSignInTime,
        settings: settings,
        profilePicture: localStorage.getItem(`profile_${user.uid}`) ? 'Stored locally' : 'Not found'
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${userEmail}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data downloaded successfully! 📁', {
        style: {
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
    } catch (error) {
      console.error('🔧 SettingsPage: Download error:', error);
      toast.error('Failed to download data. Please try again.');
    }
  };

  // Active session info
  const sessionInfo = user ? {
    email: userEmail,
    lastSignIn: user.metadata?.lastSignInTime,
    creationTime: user.metadata?.creationTime,
    uid: user.uid,
    provider: user.providerData?.[0]?.providerId
  } : null;

  const providerId = user?.providerData?.[0]?.providerId;
  const isGoogleUser = providerId === 'google.com';
  const isPasswordUser = providerId === 'password';

  // Function to set and link password for Google users
  const handleSetPassword = async () => {
    try {
      const { value: newPassword } = await MySwal.fire({
        title: 'Set a Password for Your Account',
        html: `<input id="swal-input-password" class="swal2-input" placeholder="New Password" type="password">` +
              `<input id="swal-input-confirm" class="swal2-input" placeholder="Confirm Password" type="password">`,
        focusConfirm: false,
        preConfirm: () => {
          const password = document.getElementById('swal-input-password').value;
          const confirm = document.getElementById('swal-input-confirm').value;
          if (!password || !confirm) {
            Swal.showValidationMessage('Please fill in both fields');
            return false;
          }
          if (password.length < 6) {
            Swal.showValidationMessage('Password must be at least 6 characters');
            return false;
          }
          if (password !== confirm) {
            Swal.showValidationMessage('Passwords do not match');
            return false;
          }
          return password;
        },
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        confirmButtonText: 'Set Password',
        showCancelButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      if (newPassword) {
        const credential = EmailAuthProvider.credential(userEmail, newPassword);
        await linkWithCredential(user, credential);
        localStorage.setItem(`password_linked_${user.uid}`, 'true');
        toast.success('Password set and linked! You can now log in with email and password.');
        setShowSetPasswordModal(false);
      }
    } catch (error) {
      if (error.code === 'auth/credential-already-in-use') {
        toast.error('This password is already linked to another account. Please use a different password.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.');
      } else {
        toast.error('Failed to set password: ' + (error?.message || ''));
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Settings...</p>
        </div>
      </div>
    );
  }

  console.log('🔧 SettingsPage: Rendering with user:', userEmail);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm flex items-center"
            >
              <i className="bi bi-arrow-left mr-2"></i>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              <i className="bi bi-gear text-purple-600 mr-3"></i>
              Settings
            </h1>
          </div>
          
          {/* Debug buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                console.log('🔧 SettingsPage: Current navigation stack:', window.NavigationStack?.stack);
                alert('Navigation stack: ' + JSON.stringify(window.NavigationStack?.stack));
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Debug Stack
            </button>
            <button
              onClick={() => {
                const safePrev = window.NavigationStack?.getSafePrevious();
                alert('Safe previous: ' + safePrev);
              }}
              className="px-3 py-1 bg-green-500 text-white rounded text-xs"
            >
              Safe Prev
            </button>
            <button
              onClick={() => {
                const actualPrev = window.NavigationStack?.getActualPrevious();
                alert('Actual previous: ' + actualPrev);
              }}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-xs"
            >
              Actual Prev
            </button>
          </div>
        </div>

        {!userEmail && (
          <div style={{background:'#ffcccc',color:'#900',padding:'10px',marginBottom:'10px',border:'1px solid #900',borderRadius:'6px',fontWeight:'bold'}}>
            Warning: User email is missing. Please sign out and sign in again to refresh your session.
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Logged in as: {userEmail}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Notifications Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="bi bi-bell text-purple-600 mr-2"></i>
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive browser notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sms}
                    onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="bi bi-shield-lock text-purple-600 mr-2"></i>
              Privacy
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Show Email Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to see your email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showEmail}
                    onChange={(e) => handleSettingChange('privacy', 'showEmail', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Show Phone Number</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to see your phone</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showPhone}
                    onChange={(e) => handleSettingChange('privacy', 'showPhone', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="bi bi-gear text-purple-600 mr-2"></i>
              Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.preferences.darkMode}
                    onChange={(e) => handleSettingChange('preferences', 'darkMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="IST">Indian Standard Time</option>
                  <option value="GMT">Greenwich Mean Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="bi bi-person-gear text-purple-600 mr-2"></i>
              Account Management
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Account Status</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.emailVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user?.emailVerified 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {user?.emailVerified ? '✓ Verified' : '⚠ Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Last Login</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.metadata?.lastSignInTime 
                      ? new Date(user.metadata.lastSignInTime).toLocaleString() 
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Account Created</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.metadata?.creationTime 
                      ? new Date(user.metadata.creationTime).toLocaleDateString() 
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="bi bi-shield-check text-purple-600 mr-2"></i>
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <button 
                  onClick={handleEnable2FA}
                  disabled={isEnabling2FA}
                  className={`px-4 py-2 ${twoFactorEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors duration-200 text-sm disabled:opacity-50`}
                >
                  {isEnabling2FA ? (twoFactorEnabled ? 'Disabling...' : 'Enabling...') : (twoFactorEnabled ? 'Disable' : 'Enable')}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Active Session</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current device/session info</p>
                </div>
                <div className="text-right text-xs text-gray-700 dark:text-gray-200">
                  <div><b>Email:</b> {sessionInfo?.email}</div>
                  <div><b>Provider:</b> {sessionInfo?.provider}</div>
                  <div><b>Last Sign-In:</b> {sessionInfo?.lastSignIn ? new Date(sessionInfo.lastSignIn).toLocaleString() : 'N/A'}</div>
                  <div><b>Created:</b> {sessionInfo?.creationTime ? new Date(sessionInfo.creationTime).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                </div>
                <button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing...' : 'Change'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Reset Password</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Send password reset link to email</p>
                </div>
                <button 
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Active Sessions</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your active sessions</p>
                </div>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i className="bi bi-database text-purple-600 mr-2"></i>
              Data & Privacy
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Download My Data</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get a copy of your data</p>
                </div>
                <button 
                  onClick={handleDownloadData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                >
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Privacy Policy</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Read our privacy policy</p>
                </div>
                <button 
                  onClick={() => navigate('/privacy-policy')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Admin Settings - Only show for admin users */}
          {isAdmin && (
            <div className="bg-gradient-to-r from-red-50 to-purple-50 dark:from-red-900/20 dark:to-purple-900/20 rounded-xl shadow-lg p-6 border border-red-200 dark:border-red-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                <i className="bi bi-shield-star text-red-600 mr-2"></i>
                Admin Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Admin Panel Access</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Access the admin dashboard</p>
                  </div>
                  <button 
                    onClick={() => navigate('/adminpanel')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                  >
                    Open Admin Panel
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Admin Session Status</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isAdminLoggedIn ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAdminLoggedIn
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {isAdminLoggedIn ? '✓ Active' : '⚠ Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Admin Logout</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sign out from admin panel only</p>
                  </div>
                  <button 
                    onClick={() => {
                      sessionStorage.removeItem('adminToken');
                      sessionStorage.removeItem('adminUser');
                      toast.success('Admin session ended!');
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm"
                  >
                    Admin Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show info after password reset for Google users */}
          {showPasswordResetInfo && (
            <div style={{background:'#e0e7ff',color:'#3730a3',padding:'10px',marginBottom:'10px',border:'1px solid #6366f1',borderRadius:'6px',fontWeight:'bold'}}>
              Password reset link sent! <br />
              <b>To finish setting your password, please log out and log in again using your email and new password.</b> <br />
              This will link your password to your Google account and stop the session popup from appearing.
              <button onClick={() => setShowPasswordResetInfo(false)} style={{marginLeft:'1rem',padding:'0.2rem 1rem',background:'#6366f1',color:'#fff',border:'none',borderRadius:'4px',fontWeight:'bold'}}>Dismiss</button>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
            >
              <i className="bi bi-check-circle mr-2"></i>
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {showSessionModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:'2rem',borderRadius:'12px',maxWidth:'90vw',maxHeight:'90vh',overflow:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'1rem'}}>Active Session Info</h2>
            <pre style={{fontSize:'13px',background:'#f8f9fa',padding:'1rem',borderRadius:'8px'}}>{JSON.stringify(sessionInfo,null,2)}</pre>
            <button onClick={()=>setShowSessionModal(false)} style={{marginTop:'1rem',marginLeft:'1rem',padding:'0.5rem 1.5rem',background:'#764ba2',color:'#fff',border:'none',borderRadius:'6px',fontWeight:'bold'}}>Close</button>
          </div>
        </div>
      )}

      {/* Set Password Modal for first Google login */}
      {showSetPasswordModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:'2rem',borderRadius:'12px',maxWidth:'90vw',maxHeight:'90vh',overflow:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'1rem'}}>Set a Password for Your Account</h2>
            <p style={{marginBottom:'1rem'}}>For extra security, please set a password for your account. You will only need to do this once.</p>
            <button onClick={handleSetPassword} style={{marginTop:'1rem',padding:'0.5rem 1.5rem',background:'#667eea',color:'#fff',border:'none',borderRadius:'6px',fontWeight:'bold'}}>Set Password</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage; 