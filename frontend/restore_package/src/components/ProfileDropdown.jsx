import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { toast } from 'react-hot-toast';
import './ProfileDropdown.css';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAILS = ['atulsinghdhakad15@gmail.com'];
const MySwal = withReactContent(Swal);

const ProfileDropdown = ({ user, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const { logout } = useAuth();

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

  const isAdmin = ADMIN_EMAILS.includes(user.email);

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
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="avatar-image"
                onClick={e => { e.stopPropagation(); setShowFullPhoto(true); }}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <div className="avatar-placeholder">
                {getUserInitials(user.displayName)}
              </div>
            )}
            <div className="holographic-ring"></div>
            <div className="holographic-ring ring-2"></div>
            <div className="holographic-ring ring-3"></div>
          </div>
          {/* User Info - Hidden on mobile */}
          <div className="user-info">
            <p className="user-name">{user.displayName || 'User'}</p>
            <p className="user-email">{user.email}</p>
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
              <div className="welcome-message">Welcome, {user.displayName || 'User'}</div>
              <div className="profile-section">
                {/* Large Holographic Avatar */}
                <div className="large-holographic-avatar" onClick={() => setShowFullPhoto(true)} style={{ cursor: 'pointer' }}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="large-avatar-image"
                    />
                  ) : (
                    <div className="large-avatar-placeholder">
                      {getUserInitials(user.displayName)}
                    </div>
                  )}
                  <div className="large-holographic-ring"></div>
                  <div className="large-holographic-ring ring-2"></div>
                  <div className="large-holographic-ring ring-3"></div>
                </div>
                {/* User Details */}
                <div className="user-details">
                  <h3 className="user-title">{user.displayName || 'User'}</h3>
                  <p className="user-subtitle">{user.email}</p>
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
                  console.log('🔗 ProfileDropdown: Navigating to /profile');
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
                  console.log('🔗 ProfileDropdown: Navigating to /settings');
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
                  to="/adminlogin"
                  onClick={() => {
                    console.log('🔗 ProfileDropdown: Navigating to /adminlogin');
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
              <div className="menu-divider"></div>
              {/* Regular Logout Button */}
              <button
                onClick={handleLogout}
                className={`menu-item logout-item ${hoveredItem === 'logout' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredItem('logout')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="item-icon">🚪</div>
                <span className="item-text">Sign Out</span>
                <div className="item-glow"></div>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Full Photo Modal */}
      {showFullPhoto && user.photoURL && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.7)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowFullPhoto(false)}>
          <img src={user.photoURL} alt="Full Profile" style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:'16px',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}} />
          <button onClick={()=>setShowFullPhoto(false)} style={{position:'absolute',top:30,right:30,padding:'0.5rem 1rem',background:'#764ba2',color:'#fff',border:'none',borderRadius:'6px',fontWeight:'bold',fontSize:'1.2rem',cursor:'pointer'}}>Close</button>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown; 