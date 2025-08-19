import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlobeAltIcon, Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button } from './ui';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Debug authentication state
  useEffect(() => {
    console.log('Navbar: Authentication state changed', { 
      user: user ? { id: user.id, email: user.email, role: user.role } : null, 
      isAuthenticated 
    });
  }, [user, isAuthenticated]);

  useEffect(() => {
    console.log('Navbar: Component mounted');
    return () => {
      console.log('Navbar: Component unmounted');
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to home even if logout API fails
      navigate('/');
    }
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

    // Try to get first name initial from fullName
    if (user.fullName && typeof user.fullName === 'string') {
      return user.fullName.charAt(0).toUpperCase();
    }

    // Try to get first name initial from profile
    if (user.profile?.firstName && typeof user.profile.firstName === 'string') {
      return user.profile.firstName.charAt(0).toUpperCase();
    }

    // Fall back to email initial
    if (user.email && typeof user.email === 'string') {
      return user.email.charAt(0).toUpperCase();
    }

    // Fall back to username initial
    if (user.username && typeof user.username === 'string') {
      return user.username.charAt(0).toUpperCase();
    }

    // Ultimate fallback
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';

    // Try fullName first
    if (user.fullName && typeof user.fullName === 'string') {
      return user.fullName;
    }

    // Try profile firstName + lastName
    if (user.profile?.firstName) {
      const lastName = user.profile?.lastName || '';
      return `${user.profile.firstName} ${lastName}`.trim();
    }

    // Fall back to email (first part)
    if (user.email && typeof user.email === 'string') {
      return user.email.split('@')[0];
    }

    // Fall back to username
    if (user.username && typeof user.username === 'string') {
      return user.username;
    }

    return 'User';
  };

  // Get user profile picture
  const getUserProfilePicture = () => {
    if (!user) return null;

    // Try profilePicture field
    if (user.profilePicture && typeof user.profilePicture === 'string') {
      return user.profilePicture;
    }

    // Try profile.profilePicture
    if (user.profile?.profilePicture && typeof user.profile.profilePicture === 'string') {
      return user.profile.profilePicture;
    }

    return null;
  };

  // Handle navigation clicks based on user authentication and role
  const handleNavClick = (linkType) => {
    if (!user) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }

    // Handle based on user role and link type
    if (linkType === 'talent') {
      // Find Talent - redirect to client dashboard or appropriate page
      if (user.role === 'client') {
        navigate('/client');
      } else {
        navigate('/login'); // Other roles shouldn't access this
      }
    } else if (linkType === 'work') {
      // Find Work - redirect to freelancer dashboard or appropriate page
      if (user.role === 'freelancer') {
        navigate('/freelancer');
      } else {
        navigate('/login'); // Other roles shouldn't access this
      }
    }
  };

  // Get navigation links based on user role
  const getNavLinks = () => {
    const baseLinks = [
      { name: 'Why WebSphere?', href: '#why', type: 'static' },
    ];

    if (!user) {
      // Not logged in - show both options
      return [
        { name: 'Find Talent', onClick: () => handleNavClick('talent'), type: 'action' },
        { name: 'Find Work', onClick: () => handleNavClick('work'), type: 'action' },
        ...baseLinks
      ];
    } else if (user.role === 'client') {
      // Client logged in - show only Find Talent
      return [
        { name: 'Find Talent', onClick: () => handleNavClick('talent'), type: 'action' },
        ...baseLinks
      ];
    } else if (user.role === 'freelancer') {
      // Freelancer logged in - show only Find Work
      return [
        { name: 'Find Work', onClick: () => handleNavClick('work'), type: 'action' },
        ...baseLinks
      ];
    } else {
      // Admin or other roles - show basic links
      return baseLinks;
    }
  };

  const navLinks = getNavLinks();

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
              link.type === 'static' ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="nav-link"
                >
                  {link.name}
                </a>
              ) : (
                <button
                  key={link.name}
                  onClick={link.onClick}
                  className="nav-link"
                >
                  {link.name}
                </button>
              )
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {(!user || !isAuthenticated) ? (
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
                  className="flex items-center space-x-3 transition-colors p-2 rounded-lg hover:bg-white/90 bg-white/80 border border-white/30 shadow-sm"
                >
                  {/* Profile Picture or Initial */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-accent">
                    {getUserProfilePicture() ? (
                      <img
                        src={getUserProfilePicture()}
                        alt={getUserDisplayName()}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span
                      className={`text-white font-semibold text-sm ${getUserProfilePicture() ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                    >
                      {getUserInitial()}
                    </span>
                  </div>

                  {/* User Name */}
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-800">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-gray-600 capitalize">
                      {user?.role || 'User'}
                    </span>
                  </div>

                  <div className="bg-white rounded-full p-1 ml-2">
                    <ChevronDownIcon className="h-3 w-3 text-gray-800" />
                  </div>
                </button>

                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 border border-gray-200"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-accent">
                          {getUserProfilePicture() ? (
                            <img
                              src={getUserProfilePicture()}
                              alt={getUserDisplayName()}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span
                            className={`text-white font-semibold ${getUserProfilePicture() ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                          >
                            {getUserInitial()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                          <p className="text-xs text-accent font-medium capitalize">
                            {user?.role || 'User'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        </svg>
                        Dashboard
                      </Link>

                      {user?.role === 'freelancer' && (
                        <Link
                          to="/freelancer-profile-setup"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
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
                link.type === 'static' ? (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block text-white hover:text-accent px-3 py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      link.onClick();
                    }}
                    className="block w-full text-left text-white hover:text-accent px-3 py-2 transition-colors"
                  >
                    {link.name}
                  </button>
                )
              ))}
              <div className="border-t border-white/20 pt-3 space-y-2">
                {(!user || !isAuthenticated) ? (
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
