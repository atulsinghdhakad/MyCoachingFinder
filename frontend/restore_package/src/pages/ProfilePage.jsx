import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { updateProfile, updatePassword } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal'; // for Modal Popup
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'; // for phone number verification

Modal.setAppElement('#root'); // Necessary for accessibility

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // Track if 2FA is enabled

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleProfileUpdate = async () => {
    // Update display name
    if (newDisplayName) {
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName,
      });
    }

    // Update profile photo
    if (newProfilePhoto) {
      const photoURL = URL.createObjectURL(newProfilePhoto);
      await updateProfile(auth.currentUser, {
        photoURL,
      });
    }

    // Update password
    if (newPassword) {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password updated successfully!');
    }

    toast.success('Profile updated!');
    setIsModalOpen(false);
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

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>Your Profile</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          Edit Profile
        </button>
      </div>
      <div className="profile-info">
        <p><strong>Name:</strong> {user?.displayName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        {user?.photoURL && <img src={user.photoURL} alt="Profile" />}
        <p><strong>Phone Verified:</strong> {isPhoneVerified ? 'Yes' : 'No'}</p>
        <p><strong>2FA Enabled:</strong> {is2FAEnabled ? 'Enabled' : 'Not Enabled'}</p>
      </div>

      {/* Modal for editing profile */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleProfileUpdate}>
          <label>
            Display Name
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="New Display Name"
            />
          </label>
          <label>
            Profile Picture
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewProfilePhoto(e.target.files[0])}
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
            />
          </label>
          <label>
            Phone Number (For 2FA)
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
            />
            <button type="button" onClick={handlePhoneNumberVerification}>Send OTP</button>
          </label>
          <label>
            Verification Code
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter OTP"
            />
            <button type="button" onClick={verifyOTP}>Verify OTP</button>
          </label>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
        <div id="recaptcha-container"></div>
      </Modal>
    </div>
  );
};

export default ProfilePage;