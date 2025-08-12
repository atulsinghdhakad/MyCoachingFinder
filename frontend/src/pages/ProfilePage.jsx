// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';
import ImageCropper from '../components/ImageCropper';
import { useAuth } from '../context/AuthContext';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import './ProfilePage.css';

Modal.setAppElement('#root');

const ProfilePage = () => {
  const { currentUser, isAdmin } = useAuth();
  const user = currentUser;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [croppedPhoto, setCroppedPhoto] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setNewDisplayName(user.displayName || '');
    }
  }, [user]);

  // Admin role is now managed by AuthContext

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      if (newDisplayName && newDisplayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: newDisplayName });
      }
      if (croppedPhoto) {
        const photoURL = URL.createObjectURL(croppedPhoto);
        await updateProfile(auth.currentUser, { photoURL });
      }
      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success('Password updated successfully!');
      }
      toast.success('Profile updated successfully!');
      setIsModalOpen(false);
    } catch (err) {
      toast.error(`Error updating profile: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    toast.success('Signed out successfully!');
    navigate('/login');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewProfilePhoto(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = (blob) => {
    setCroppedPhoto(blob);
    setShowCropper(false);
    toast.success('Photo cropped and ready to be saved.');
  };

  // Phone Number Verification (2FA)
  const handlePhoneNumberVerification = () => {
    const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
    }, auth);
    signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        toast.success('OTP sent to your phone!');
      })
      .catch((error) => {
        toast.error('Error sending OTP: ' + error.message);
      });
  };

  // Verify OTP and complete phone authentication
  const verifyOTP = () => {
    const { confirmationResult } = window;
    confirmationResult.confirm(verificationCode)
      .then((result) => {
        setIsPhoneVerified(true);
        toast.success('Phone verified successfully!');
      })
      .catch((error) => {
        toast.error('Error verifying OTP: ' + error.message);
      });
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen text-lg text-purple-500">Loading Profile...</div>;
  }

  const userType = isAdmin ? 'Administrator' : 'User';
  console.log('ProfilePage: user.email =', user.email, 'isAdmin =', isAdmin, 'userType =', userType);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-700 via-pink-500 to-indigo-700 p-4">
      <div className="w-full max-w-4xl glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-2xl">
        <div className="md:grid md:grid-cols-3">
          {/* Left Column: Profile Info */}
          <div className="md:col-span-1 flex flex-col items-center text-center p-8 relative">
            <div className="relative group">
              <div className="glow-avatar absolute -inset-2 rounded-full blur-xl opacity-60 group-hover:opacity-90 transition"></div>
              <img
                src={croppedPhoto ? URL.createObjectURL(croppedPhoto) : user.photoURL || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(user.email || user.displayName || 'user')}
                alt="Profile"
                className="w-36 h-36 rounded-full object-cover border-4 border-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 shadow-2xl z-10"
              />
              <span 
                className={`absolute bottom-2 right-2 px-3 py-1 text-xs font-bold rounded-full shadow-md ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-600 text-white'} animate-pulse`}
              >
                {userType}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold mt-6 text-gray-900 dark:text-white tracking-tight drop-shadow-lg">{user.displayName || 'User'}</h2>
            <p className="text-purple-300 text-lg font-mono mt-1 mb-2">{user.email}</p>
            <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300 mt-2">
              <span><strong>Phone Verified:</strong> {isPhoneVerified ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>}</span>
              <span><strong>2FA Enabled:</strong> {is2FAEnabled ? <span className="text-green-400">Enabled</span> : <span className="text-yellow-400">Not Enabled</span>}</span>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-6 rounded-full font-bold shadow-lg text-base transition-transform transform hover:scale-105">
              <i className="bi bi-pencil-square mr-2"></i>Edit Profile
            </button>
          </div>

          {/* Right Column: Actions */}
          <div className="md:col-span-2 p-10 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 tracking-wide">Account Actions</h3>
            <div className="space-y-5">
              {isAdmin && (
                <Link 
                  to={isAdmin ? "/adminpanel" : "/adminlogin"}
                  className="flex items-center gap-4 w-full glass-btn bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-semibold shadow-xl transition-all"
                >
                  <i className="bi bi-shield-lock text-2xl"></i>
                  <span>Admin Panel</span>
                </Link>
              )}
              <Link to="/settings" className="flex items-center gap-4 w-full glass-btn bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-600 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold shadow-xl transition-all">
                <i className="bi bi-gear text-2xl"></i>
                <span>Settings</span>
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-4 w-full glass-btn bg-gradient-to-r from-red-400 to-pink-500 hover:from-pink-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-semibold shadow-xl transition-all">
                <i className="bi bi-box-arrow-right text-2xl"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="modern-edit-modal" overlayClassName="modern-edit-overlay">
          {!showCropper ? (
            <>
              <h2 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 text-transparent bg-clip-text animate-gradient-x drop-shadow-lg tracking-wider">Edit Your Profile</h2>
              <form onSubmit={handleProfileUpdate} className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <label className="relative group">
                    <span className="floating-label">Display Name</span>
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={e => setNewDisplayName(e.target.value)}
                      className="modern-input"
                      placeholder=" "
                    />
                  </label>
                  <label className="relative group">
                    <span className="floating-label">Change Profile Picture</span>
                    <div className="modern-dropzone" onClick={() => document.getElementById('profile-photo-input').click()}>
                      <input
                        id="profile-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      {newProfilePhoto ? (
                        <img src={newProfilePhoto} alt="Preview" className="modern-avatar-preview animate-pop" />
                      ) : (
                        <div className="modern-avatar-placeholder animate-pulse">Drop or Click to Upload</div>
                      )}
                    </div>
                  </label>
                  <label className="relative group">
                    <span className="floating-label">New Password</span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="modern-input"
                      placeholder=" "
                    />
                  </label>
                  <div className="modern-divider"></div>
                  <label className="relative group">
                    <span className="floating-label">Phone Number (For 2FA)</span>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="modern-input"
                      placeholder=" "
                    />
                    <button type="button" onClick={handlePhoneNumberVerification} className="modern-btn modern-btn-glow mt-2">Send OTP</button>
                  </label>
                  <label className="relative group">
                    <span className="floating-label">Verification Code</span>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="modern-input"
                      placeholder=" "
                    />
                    <button type="button" onClick={verifyOTP} className="modern-btn modern-btn-glow mt-2">Verify OTP</button>
                  </label>
                </div>
                <div className="flex gap-4 mt-6 justify-center">
                  <button type="submit" className="modern-btn modern-btn-gradient animate-bounce-x">Save Changes</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="modern-btn modern-btn-cancel">Cancel</button>
                </div>
              </form>
            </>
          ) : (
            <ImageCropper
              imageSrc={newProfilePhoto}
              onCrop={handleCrop}
              onClose={() => setShowCropper(false)}
            />
          )}
          <div id="recaptcha-container"></div>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;
