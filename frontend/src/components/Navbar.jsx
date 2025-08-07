import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlobeAltIcon, Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button } from './ui';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Safely parse user data
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setUser(null);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'client') return '/client';
    if (user.role === 'freelancer') return '/freelancer';
    return '/';
  };

  // Safe function to get user initials
  const getUserInitial = () => {
    if (!user) return 'U';
    
    // Try to get first name initial
    if (user.profile?.firstName && typeof user.profile.firstName === 'string') {
      return user.profile.firstName.charAt(0).toUpperCase();
    }
    
    // Fall back to username initial
    if (user.username && typeof user.username === 'string') {
      return user.username.charAt(0).toUpperCase();
    }
    
    // Ultimate fallback
    return 'U';
  };

  const navLinks = [
    { name: 'Find Talent', href: '#talent' },
    { name: 'Find Work', href: '#work' },
    { name: 'Why WebSphere?', href: '#why' },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-border' : 'bg-white/90 backdrop-blur-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <GlobeAltIcon className="h-8 w-8 text-primary" />
            <span className="text-gray-dark font-bold text-xl">WebSphere</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="nav-link"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Button
                  as={Link}
                  to="/login"
                  variant="ghost"
                  size="medium"
                >
                  Login
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  size="medium"
                >
                  Register
                </Button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-white hover:text-accent transition-colors"
                >
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {getUserInitial()}
                    </span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2"
                  >
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    {user?.role === 'freelancer' && (
                      <Link
                        to="/freelancer-profile-setup"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden bg-primary/95 backdrop-blur-lg"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-white hover:text-accent px-3 py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="border-t border-white/20 pt-3 space-y-2">
                {!user ? (
                  <>
                    <Link
                      to="/login"
                      className="block text-white hover:text-accent px-3 py-2 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block bg-accent text-white px-3 py-2 rounded-lg transition-colors hover:bg-accent/90"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="block text-white hover:text-accent px-3 py-2 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left text-white hover:text-accent px-3 py-2 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
