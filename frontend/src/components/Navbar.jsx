import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlobeAltIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Button } from './ui';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import NotificationSettings from './NotificationSettings';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import { HeaderConnectionStatus } from './ConnectionStatus';
import { TourButton } from './ClientTour';
import pushNotificationService from '../services/pushNotificationService';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [settingsDropdownRef, setSettingsDropdownRef] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsDropdownRef && !settingsDropdownRef.contains(event.target)) {
        setShowNotificationSettings(false);
      }
    };

    if (showNotificationSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationSettings, settingsDropdownRef]);

  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug authentication state
  useEffect(() => {
    console.log('Navbar: Authentication state changed', { 
      user: user ? { id: user.id, email: user.email, role: user.role } : null, 
      isAuthenticated 
    });
  }, [user, isAuthenticated]);
  
  // Initialize push notifications when user logs in - one-time prompt per user
  useEffect(() => {
    const maybePromptPushEnable = async () => {
      if (!isAuthenticated || !user || !pushNotificationService.isSupported()) return;
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${apiBaseUrl}/api/notifications/should-prompt`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data?.success && data.shouldPrompt && !pushNotificationService.isPermissionBlocked()) {
          // Show prompt toast one-time
          toast((t) => (
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Enable Push Notifications?</p>
              <p className="text-sm text-gray-600">Get alerts for payment due dates and deliverable deadlines.</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={async () => {
                    try {
                      await pushNotificationService.subscribe();
                      toast.success('Push notifications enabled!');
                    } catch (err) {
                      if (err?.message === 'PERMISSION_BLOCKED') {
                        showPermissionBlockedToast();
                      } else {
                        toast.error('Failed to enable notifications');
                      }
                    } finally {
                      try {
                        await axios.post(`${apiBaseUrl}/api/notifications/prompt-seen`, {}, { headers: { Authorization: `Bearer ${token}` }});
                      } catch (_) {}
                      toast.dismiss(t.id);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Enable
                </button>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${apiBaseUrl}/api/notifications/prompt-seen`, {}, { headers: { Authorization: `Bearer ${token}` }});
                    } catch (_) {}
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Later
                </button>
              </div>
            </div>
          ), { duration: 15000, icon: '🔔' });
        }
      } catch (e) {
        console.error('Push prompt check failed:', e);
      }
    };
    maybePromptPushEnable();
  }, [isAuthenticated, user]);

  // Function to show permission blocked toast with instructions
  const showPermissionBlockedToast = () => {
    toast((t) => (
      <div className="max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">🔒</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">Notifications Blocked</p>
            <p className="text-sm text-gray-600 mb-3">
              You've blocked notifications for this site. To enable them:
            </p>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-3">
              <li>Click the lock icon (🔒) in the address bar</li>
              <li>Find "Notifications" in the permissions list</li>
              <li>Change it from "Block" to "Allow"</li>
              <li>Reload this page</li>
            </ol>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    ), {
      duration: 15000,
      icon: '⚠️'
    });
  };

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

  // Handle navigation clicks - based on user role and authentication status
  const handleNavClick = (linkType) => {
    if (linkType === 'talent') {
      // Find Talent - go to client dashboard/page
      if (user && user.role === 'client') {
        navigate('/client?tab=freelancers');
      } else {
        // Show general "hire talent" information for non-clients
        navigate('/register'); // They can register as client
      }
    } else if (linkType === 'work') {
      // Find Work behavior based on authentication
      if (!isAuthenticated) {
        // Not logged in - redirect to login
        navigate('/login');
      } else if (user && user.role === 'freelancer') {
        // Freelancer logged in - go to freelancer dashboard
        navigate('/freelancer');
      } else {
        // Other roles - redirect to login
        navigate('/login');
      }
    } else if (linkType === 'why') {
      // Why WebSphere - accessible to all
      navigate('/why-websphere');
    }
  };

  // Get navigation links - conditional based on authentication status and user role
  const getNavLinks = () => {
    const links = [
      { name: 'Why WebSphere?', onClick: () => handleNavClick('why'), type: 'action' },
    ];

    if (!isAuthenticated) {
      // Not logged in: show both Find Talent and Find Work
      links.unshift({ name: 'Find Talent', onClick: () => handleNavClick('talent'), type: 'action' });
      links.unshift({ name: 'Find Work', onClick: () => handleNavClick('work'), type: 'action' });
    } else if (user && user.role === 'freelancer') {
      // Freelancer logged in: hide Find Talent, show Find Work (goes to dashboard)
      links.unshift({ name: 'Find Work', onClick: () => handleNavClick('work'), type: 'action' });
    } else if (user && user.role === 'client') {
      // Client logged in: show Find Talent, hide Find Work
      links.unshift({ name: 'Find Talent', onClick: () => handleNavClick('talent'), type: 'action' });
    } else {
      // Other roles (admin, etc.): show Find Talent only
      links.unshift({ name: 'Find Talent', onClick: () => handleNavClick('talent'), type: 'action' });
    }

    return links;
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
              <div className="flex items-center gap-4">
                {/* Connection Status */}
                <HeaderConnectionStatus />
                
                {/* Tour Button for Clients - Only on Dashboard */}
                {user?.role === 'client' && location.pathname === '/client' && (
                  <TourButton onClick={() => window.startClientTour && window.startClientTour()} />
                )}
                
                {/* Notification Settings Dropdown */}
                <div className="relative" ref={setSettingsDropdownRef}>
                  <button
                    onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                    title="Notification Settings"
                  >
                    <Cog6ToothIcon className="w-6 h-6" />
                  </button>
                  
                  {showNotificationSettings && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <NotificationSettings 
                        isOpen={showNotificationSettings}
                        onClose={() => setShowNotificationSettings(false)}
                        isDropdown={true}
                      />
                    </div>
                  )}
                </div>
                
                {/* Notification Center */}
                <div className="notification-center">
                  <NotificationCenter />
                </div>
                
                {/* User Profile Dropdown */}
                <div className="relative user-menu">
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
                        <div className="relative">
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
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <OnlineStatusIndicator userId={user?._id || user?.userId || user?.id} size="sm" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getUserDisplayName()}
                          </p>
                          <OnlineStatusIndicator userId={user?._id || user?.userId || user?.id} size="xs" showText className="mt-1" />
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
