// ProfileDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { toast } from 'react-hot-toast';
import './ProfileDropdown.css';
import { useAuth } from '../context/AuthContext';

const MySwal = withReactContent(Swal);

const ProfileDropdown = ({ user, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const { logout, isAdmin, currentUser } = useAuth();

  // Use currentUser from AuthContext if user prop is not provided
  const displayUser = user || currentUser;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const result = await MySwal.fire({
      title: '🚀 Sign Out',
      text: 'Ready to blast off?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FF6B6B',
      cancelButtonColor: '#4ECDC4',
      confirmButtonText: '🚀 Launch',
      cancelButtonText: 'Stay',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        await logout();
        localStorage.removeItem('adminSession');
        toast.success('🚀 Launched into orbit!', {
          style: {
            background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
            color: '#fff',
            fontWeight: 'bold',
          },
        });
        setTimeout(() => {
          navigate('/login');
        }, 100);
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Launch failed. Please try again.');
      }
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  console.log('ProfileDropdown: displayUser =', displayUser, 'isAdmin =', isAdmin, 'user.email =', displayUser?.email);

  return (
    <>
      <div className="relative profile-dropdown" ref={dropdownRef}>
        {/* Futuristic Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="futuristic-profile-btn group"
        >
          {/* Holographic Avatar */}
          <div className="holographic-avatar">
            {displayUser?.photoURL ? (
              <img
                src={displayUser.photoURL}
                alt="Profile"
                className="avatar-image"
                onClick={e => { e.stopPropagation(); setShowFullPhoto(true); }}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <div className="avatar-placeholder">
                {getUserInitials(displayUser?.displayName)}
              </div>
            )}
            <div className="holographic-ring"></div>
            <div className="holographic-ring ring-2"></div>
            <div className="holographic-ring ring-3"></div>
          </div>
          {/* User Info - Hidden on mobile */}
          <div className="user-info">
            <p className="user-name">{displayUser?.displayName || 'User'}</p>
            <p className="user-email">{displayUser?.email}</p>
          </div>
          {/* Animated Arrow */}
          <div className={`arrow-container ${isOpen ? 'open' : ''}`}>
            <div className="arrow"></div>
          </div>
        </button>

        {/* Futuristic Dropdown Menu */}
        {isOpen && (
          <div className="futuristic-dropdown">
            {/* Floating Particles */}
            <div className="particles">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="particle" style={{ '--delay': `${i * 0.1}s` }}></div>
              ))}
            </div>
            {/* Header Section */}
            <div className="dropdown-header">
              <div className="welcome-message">Welcome, {displayUser?.displayName || 'User'}</div>
              <div className="profile-section">
                {/* Large Holographic Avatar */}
                <div className="large-holographic-avatar" onClick={() => setShowFullPhoto(true)} style={{ cursor: 'pointer' }}>
                  {displayUser?.photoURL ? (
                    <img
                      src={displayUser.photoURL}
                      alt="Profile"
                      className="large-avatar-image"
                    />
                  ) : (
                    <div className="large-avatar-placeholder">
                      {getUserInitials(displayUser?.displayName)}
                    </div>
                  )}
                  <div className="large-holographic-ring"></div>
                  <div className="large-holographic-ring ring-2"></div>
                  <div className="large-holographic-ring ring-3"></div>
                </div>
                {/* User Details */}
                <div className="user-details">
                  <h3 className="user-title">{displayUser?.displayName || 'User'}</h3>
                  <p className="user-subtitle">{displayUser?.email}</p>
                  {isAdmin && (
                    <div className="admin-badge">
                      <span className="badge-text">ADMIN</span>
                      <div className="badge-glow"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Menu Items */}
            <div className="menu-items">
              <Link
                to="/profile"
                onClick={() => {
                  setIsOpen(false);
                }}
                className={`menu-item ${hoveredItem === 'profile' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="item-icon">👤</div>
                <span className="item-text">Profile</span>
                <div className="item-glow"></div>
              </Link>
              <Link
                to="/settings"
                onClick={() => {
                  setIsOpen(false);
                }}
                className={`menu-item ${hoveredItem === 'settings' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredItem('settings')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="item-icon">⚙️</div>
                <span className="item-text">Settings</span>
                <div className="item-glow"></div>
              </Link>
              {isAdmin && (
                <Link
                  to={localStorage.getItem('adminSession') === 'true' ? "/adminpanel" : "/adminlogin"}
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className={`menu-item admin-item ${hoveredItem === 'admin' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('admin')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="item-icon">🛡️</div>
                  <span className="item-text">Admin Panel</span>
                  <div className="item-glow"></div>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className={`menu-item logout-item ${hoveredItem === 'logout' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredItem('logout')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="item-icon">🚀</div>
                <span className="item-text">Logout</span>
                <div className="item-glow"></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileDropdown;
