import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext'; // ✅ useAuth hook
import coachingFinderLogo from './images/logo.png';
import './Navbar.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { toast } from 'react-hot-toast';
import ProfileDropdown from './ProfileDropdown';

const MySwal = withReactContent(Swal);

const Navbar = ({ setDarkMode, darkMode }) => {
  const { currentUser, isAdmin } = useAuth(); // ✅ Get user and admin status from context
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const result = await MySwal.fire({
      title: 'Are you sure you want to log out?',
      text: 'You will be logged out from the Admin Panel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7C3AED',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Log Out',
    });

    if (result.isConfirmed) {
      try {
        await auth.signOut();
        toast.success('You have successfully logged out!', {
          style: { background: 'linear-gradient(to right, #ff416c, #ff4b2b)', color: '#fff' },
        });
        navigate('/');
      } catch (error) {
        console.error('Error during sign-out:', error);
        toast.error('Error logging out, please try again.');
      }
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    document.body.classList.toggle('dark', !darkMode);
  };


  return (
    <nav className={`navbar ${darkMode ? 'dark' : ''} shadow-md`}>
      <div className="flex justify-between items-center w-full px-4 py-2 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2" aria-label="Homepage" onClick={() => setMenuOpen(false)}>
          <img src={coachingFinderLogo} alt="Logo" className="w-10 h-10" />
          <span className="text-xl font-semibold">Coaching Finder</span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden lg:flex space-x-2 items-center w-2/5 ml-10">
          <input type="text" placeholder="Search Institutes" className="px-3 py-1 rounded-md w-full text-black" />
          <select className="px-2 py-1 rounded-md text-black">
            <option>Category</option>
            <option>Science</option>
            <option>Math</option>
            <option>Commerce</option>
          </select>
          <select className="px-2 py-1 rounded-md text-black">
            <option>City</option>
            <option>Delhi</option>
            <option>Bhopal</option>
            <option>Mumbai</option>
          </select>
          <select className="px-2 py-1 rounded-md text-black">
            <option>Rating</option>
            <option>5⭐</option>
            <option>4⭐ & above</option>
            <option>3⭐ & above</option>
          </select>
          <button className="bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700 text-sm">Search</button>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-4 ml-6">
          <Link to="/" className="hover:text-gray-300 text-sm" aria-label="Home">Home</Link>
          <Link to="/about" className="hover:text-gray-300 text-sm" aria-label="About Us">About Us</Link>
          <Link to="/contact" className="hover:text-gray-300 text-sm" aria-label="Contact Us">Contact Us</Link>

          {/* Admin Panel Access - Industry Standard RBAC */}
          {isAdmin && (
            <Link 
              to="/adminpanel" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
              aria-label="Admin Panel"
            >
              🛡️ Admin Panel
            </Link>
          )}

          {!currentUser ? (
            <Link to="/login" className="hover:text-gray-300 text-sm" aria-label="Login">Login</Link>
          ) : (
            <ProfileDropdown user={currentUser} darkMode={darkMode} />
          )}

          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode} aria-label="Toggle Dark Mode" className="text-xl">
            {darkMode ? <i className="bi bi-sun"></i> : <i className="bi bi-moon"></i>}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="text-2xl">
            {menuOpen ? <i className="bi bi-x"></i> : <i className="bi bi-list"></i>}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-800 text-black dark:text-white py-4 space-y-3 px-6">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300" aria-label="Home">Home</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300" aria-label="About Us">About Us</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300" aria-label="Contact Us">Contact Us</Link>

          {/* Admin Panel Access - Mobile */}
          {isAdmin && (
            <Link 
              to="/adminpanel" 
              onClick={() => setMenuOpen(false)}
              className="block text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              aria-label="Admin Panel"
            >
              🛡️ Admin Panel
            </Link>
          )}

          {!currentUser ? (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300" aria-label="Login">Login</Link>
          ) : (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300" aria-label="Profile">Profile</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left text-red-600 hover:bg-red-100 px-4 py-2" aria-label="Logout">
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
