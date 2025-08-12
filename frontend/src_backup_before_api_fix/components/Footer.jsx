import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faTwitter, faLinkedinIn, faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';


const Footer = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        {/* Main content of the page goes here */}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10 mt-auto">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Branding */}
            <div className="flex justify-center md:justify-start">
              <h1 className="text-3xl font-semibold text-primary">Coaching Finder</h1>
              <p className="mt-2 text-sm text-gray-400">Your guide to the best coaching institutes.</p>
            </div>

            {/* Quick Links */}
            <div className="flex justify-center space-x-10">
              <div>
                <h2 className="font-semibold text-lg">Quick Links</h2>
                <ul className="mt-4 space-y-2">
                  <li><a href="/" className="text-gray-400 hover:text-white transition duration-200">Home</a></li>
                  <li><a href="/about" className="text-gray-400 hover:text-white transition duration-200">About Us</a></li>
                  <li><a href="/contact" className="text-gray-400 hover:text-white transition duration-200">Contact Us</a></li>
                  <li><a href="/privacy-policy" className="text-gray-400 hover:text-white transition duration-200">Privacy Policy</a></li>
                </ul>
              </div>
            </div>

            {/* Contact Info & Social Media */}
            <div className="flex justify-center space-x-10">
              <div>
                <h2 className="font-semibold text-lg">Contact Info</h2>
                <ul className="mt-4 space-y-2 text-gray-400">
                  <li className="flex items-center space-x-2">
                    <a href="tel:+917427802072" className="flex items-center space-x-2 hover:text-white transition duration-200">
                      <FontAwesomeIcon icon={faPhoneAlt} />
                      <span>+917427802072</span>
                    </a>
                  </li>
                  <li className="flex items-center space-x-2">
                    <a href="https://www.google.com/maps/place/Indore,+India" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-white transition duration-200">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>Indore, India</span>
                    </a>
                  </li>
                  <li>
                    <a href="mailto:info@coachingfinder.com" className="hover:text-white transition duration-200">
                      Email: info@coachingfinder.com
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="font-semibold text-lg">Follow Us</h2>
                <div className="mt-4 flex space-x-6">
                  <a href="https://www.facebook.com/atuldhakad15" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                    <FontAwesomeIcon icon={faFacebookF} size="lg" />
                  </a>
                  <a href="https://x.com/_atul_dhakad" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                    <FontAwesomeIcon icon={faTwitter} size="lg" />
                  </a>
                  <a href="https://linkedin.com/in/atul-dhakad" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                    <FontAwesomeIcon icon={faLinkedinIn} size="lg" />
                  </a>
                  <a href="https://www.instagram.com/_atul_dhakad_/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                    <FontAwesomeIcon icon={faInstagram} size="lg" />
                  </a>
                  <a href="https://github.com/atulsinghdhakad" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-200">
                    <FontAwesomeIcon icon={faGithub} size="lg" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
          <Link to="/privacy-policy" className="hover:text-gray-400 text-sm">
            Privacy Policy
          </Link>
        </div>
          {/* Copyright */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Coaching Finder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;