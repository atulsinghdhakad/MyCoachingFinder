import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import coachingFinderLogo from './images/logo.png';
import './Navbar.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { toast } from 'react-hot-toast';
import ScrollToTopButton from '../pages/ScrollToTop';

const ADMIN_EMAILS = ['atulsinghdhakad15@gmail.com']; // ✅ your admin emails
const MySwal = withReactContent(Swal);

const Navbar = ({ setDarkMode, darkMode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [setLoggingOut] = useState(false);

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
        await auth.signOut();  // Sign out from Firebase
        toast.success('You have successfully logged out!', {
          style: { background: 'linear-gradient(to right, #ff416c, #ff4b2b)', color: '#fff' },
        });
        navigate('/');  // Redirect to the homepage or login page
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

  // const scrollToTop = () => {
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // };

  if (loading) return null;

  return (
    <>
      <nav className={`navbar ${darkMode ? 'dark' : ''} shadow-md`}>
        <div className="flex justify-between items-center w-full px-4 py-2 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={() => setMenuOpen(false)}>
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
            <Link to="/" className="hover:text-gray-300 text-sm">Home</Link>
            <Link to="/about" className="hover:text-gray-300 text-sm">About Us</Link>
            <Link to="/contact" className="hover:text-gray-300 text-sm">Contact Us</Link>

            {/* Admin Panel link visible only for Admin */}
            {user && ADMIN_EMAILS.includes(user.email) && (
              <Link to="/adminpanel" className="hover:text-gray-300 text-sm flex items-center gap-1">
                <i className="bi bi-shield-lock-fill"></i>Admin
              </Link>
            )}

            {!user ? (
              <Link to="/login" className="hover:text-gray-300 text-sm">Login</Link>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
                  <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Profile" className="w-8 h-8 rounded-full" />
                  <span className="ml-2 text-sm">{user.displayName || 'User'}</span>
                </div>

                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-black border border-gray-200'}`}>
                    <div className="px-4 py-3 border-b text-sm font-medium break-words">
  {user.email}
  {ADMIN_EMAILS.includes(user.email) && (
    <span className="ml-2 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
      🛡️ Admin
    </span>
  )}
</div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center text-left px-4 py-2 hover:bg-red-100 text-red-600 text-sm"
                    >
                      <i className="bi bi-box-arrow-right mr-2"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dark mode toggle */}
            <button onClick={toggleDarkMode} className="text-xl">
              {darkMode ? <i className="bi bi-sun"></i> : <i className="bi bi-moon"></i>}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">
              {menuOpen ? <i className="bi bi-x"></i> : <i className="bi bi-list"></i>}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-800 text-black dark:text-white py-4 space-y-3 px-6">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300">Home</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300">About Us</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300">Contact Us</Link>

            {user && ADMIN_EMAILS.includes(user.email) && (
              <Link to="/adminpanel" onClick={() => setMenuOpen(false)} className="flex text-sm hover:text-gray-300 items-center gap-1">
                <i className="bi bi-shield-lock-fill"></i> Admin Panel
              </Link>
            )}

            {!user ? (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm hover:text-gray-300">Login</Link>
            ) : (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left text-red-600 hover:bg-red-100 px-4 py-2">
                Logout
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Scroll To Top Button */}
      <button
        onClick={ScrollToTopButton}
        className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all"
      >
        <i className="bi bi-arrow-up"></i>
      </button>
    </>
  );
};

export default Navbar;