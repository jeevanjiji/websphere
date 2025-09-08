// frontend/src/components/AuthForm.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import GoogleLoginButton from './GoogleLoginButton';
import ValidatedInput from './ValidatedInput';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { Button, Input, Card } from './ui';
import { validateFullName, validateEmail, validatePassword, validatePasswordConfirmation, validateRegistrationForm } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';

const AuthForm = ({ mode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client'
  });

  // Validation states
  const [validationResults, setValidationResults] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Handle validation results
  const handleValidation = (fieldName, result) => {
    setValidationResults(prev => {
      const newResults = { ...prev, [fieldName]: result };

      // Check if all required fields are valid
      const requiredFields = ['fullName', 'email', 'password', 'confirmPassword'];
      const allValid = requiredFields.every(field =>
        newResults[field] && newResults[field].isValid
      );

      setIsFormValid(allValid);
      return newResults;
    });
  };

  // Handle register data changes
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showAlert = (type, title, text) => {
    const message = text || title;

    switch (type) {
      case 'success':
        return toast.success(message);
      case 'error':
        return toast.error(message);
      case 'warning':
        return toast.error(message); // Use error styling for warnings
      case 'info':
        return toast(message); // Default toast for info
      default:
        return toast(message);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      showAlert('error', 'Missing Information', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', { email: loginData.email });
      
      const data = await login(loginData);

      if (data.success) {
        await showAlert('success', 'Login Successful!', data.message);

        console.log('Login successful, navigating based on role:', data.user.role);

        // Navigate based on role and profile completion
        if (data.user.role === 'freelancer' && data.needsProfileSetup) {
          navigate('/freelancer-profile-setup');
        } else if (data.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.user.role === 'client') {
          navigate('/client-dashboard');
        } else if (data.user.role === 'freelancer') {
          navigate('/freelancer');
        } else {
          navigate('/');
        }
      } else {
        showAlert('error', 'Login Failed', data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('error', 'Connection Error', 'Server not responding. Please make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };



  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Final validation check
    const validation = validateRegistrationForm(registerData, 'client');
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      showAlert('error', 'Validation Error', firstError.message);
      return;
    }

    if (registerData.role === 'freelancer') {
      showAlert('info', 'Freelancer Registration', 'Please use the "I want to Work" button to register as a freelancer.');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration with:', {
        fullName: registerData.fullName,
        email: registerData.email,
        role: registerData.role
      });

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          fullName: registerData.fullName,
          email: registerData.email,
          password: registerData.password,
          role: registerData.role
        })
      });

      console.log('Registration response status:', response.status);
      const data = await response.json();
      console.log('Registration response data:', data);

      if (data.success) {
        // Check if verification is needed
        if (data.needsVerification) {
          if (data.emailSent) {
            await showAlert('info', 'Check Your Email',
              'We\'ve sent a verification link to your email address. Please verify your email before proceeding.');
          } else {
            await showAlert('warning', 'Email Service Unavailable',
              'Email verification is temporarily unavailable. For testing purposes, you can verify your account using the development link provided.');
          }

          // Store registration data for verification flow
          localStorage.setItem('pendingRegistration', JSON.stringify({
            ...registerData,
            userId: data.user.id,
            emailSent: data.emailSent,
            devVerificationUrl: data.devVerificationUrl
          }));

          navigate('/verify-email-notice');
          return;
        }

        // Store token if provided (for backward compatibility)
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('user', JSON.stringify(data.user));

        await showAlert('success', 'Welcome to WebSphere!', data.message);

        if (data.user.role === 'client') {
          navigate('/client-dashboard');
        } else if (data.user.role === 'freelancer') {
          navigate('/freelancer');
        }
      } else {
        // Show detailed error message if available
        const errorMessage = data.details || data.message || 'Registration failed';
        showAlert('error', 'Registration Failed', errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      showAlert('error', 'Connection Error', 'Server not responding. Please make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const pageVariants = {
    enter: (direction) => ({
      rotateY: direction > 0 ? 180 : -180,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      rotateY: direction < 0 ? 180 : -180,
      opacity: 0,
      scale: 0.8,
    }),
  };

  const pageTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="flex">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-primary/10 z-10"></div>
          <img
            src={isLogin
              ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center"
              : "https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&h=600&fit=crop&crop=center"
            }
            alt={isLogin ? "Team collaboration" : "Creative workspace"}
            className="w-full h-full object-cover transition-all duration-700 opacity-20"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center text-white px-8">
              <motion.h2
                className="heading-2 mb-4 text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {isLogin ? "Welcome Back" : "Join Our Community"}
              </motion.h2>
              <motion.p
                className="body-large text-white/90"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {isLogin
                  ? "Connect with talented freelancers and grow your business"
                  : "Start your freelancing journey with WebSphere today"
                }
              </motion.p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 min-h-screen bg-white">
          <div className="w-full max-w-md">
            {/* Back to Home Button */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-medium hover:text-gray-dark transition-colors group"
              >
                <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Home</span>
              </Link>
            </motion.div>

            <div className="bg-white rounded-xl border border-gray-border p-8 shadow-xl">
              {isLogin ? (
                  // Login Form
                  <div>
                    <div className="text-center mb-8">
                      <h1 className="heading-3 mb-2">
                        Welcome Back!
                      </h1>
                      <p className="body-regular">
                        Please enter your details to sign in
                      </p>
                    </div>

                    {/* Google Login Button */}
                    <div className="mb-6">
                      <GoogleLoginButton isRegister={false} />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center mb-6">
                      <div className="flex-1 border-t border-gray-border"></div>
                      <span className="px-4 text-gray-medium text-sm">
                        or continue with email
                      </span>
                      <div className="flex-1 border-t border-gray-border"></div>
                    </div>

                    {/* Email Login Form */}
                    <form key="login-form" onSubmit={handleLoginSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          id="login-email"
                          type="email"
                          name="email"
                          autoComplete="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData(prev => ({...prev, email: e.target.value}))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            autoComplete="current-password"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
                            required
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                          >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 hover:bg-accent hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </button>
                    </form>

                    {/* Forgot Password Link */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleForgotPassword}
                        className="text-primary hover:text-accent text-sm transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="body-regular">
                        Don't have an account?{' '}
                        <button
                          onClick={() => setIsLogin(false)}
                          className="text-primary hover:text-accent font-semibold transition-colors"
                        >
                          Sign up here
                        </button>
                      </p>
                    </div>
                  </div>
                ) : (
                  // Register Form
                  <div>
                    <div className="text-center mb-8">
                      <h1 className="heading-3 mb-2">
                        Get Started with WebSphere
                      </h1>
                      <p className="body-regular">
                        Create your client account to continue
                      </p>
                    </div>

                    {/* Google Register Button */}
                    <div className="mb-6">
                      <GoogleLoginButton isRegister={true} />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center mb-6">
                      <div className="flex-1 border-t border-gray-border"></div>
                      <span className="px-4 text-gray-medium text-sm">
                        or register with email
                      </span>
                      <div className="flex-1 border-t border-gray-border"></div>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-dark mb-3">
                        I want to:
                      </label>
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => setRegisterData({...registerData, role: 'client'})}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            registerData.role === 'client'
                              ? 'bg-primary text-white ring-2 ring-primary/50'
                              : 'bg-gray-lighter text-gray-dark hover:bg-gray-border'
                          }`}
                        >
                          💼 Hire Talent
                        </button>
                        <Link
                          to="/freelancer-registration"
                          className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-lighter text-gray-dark hover:bg-gray-border text-center transition-all border-2 border-primary/30"
                        >
                          🚀 Work as Freelancer
                        </Link>
                      </div>
                      <p className="text-gray-medium text-xs mt-2 text-center">
                        Freelancers should use the "Work as Freelancer" option for a specialized signup process
                      </p>
                    </div>

                    {/* Email Registration Form - Only for Clients */}
                    <form onSubmit={handleRegisterSubmit} className="space-y-6">
                      <ValidatedInput
                        type="text"
                        name="fullName"
                        value={registerData.fullName}
                        onChange={handleRegisterChange}
                        onValidation={handleValidation}
                        validator={validateFullName}
                        label="Full Name"
                        placeholder="Enter your full name (e.g., John Smith)"
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary focus:border-primary"
                      />

                      <ValidatedInput
                        type="email"
                        name="email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        onValidation={handleValidation}
                        validator={validateEmail}
                        label="Email Address"
                        placeholder="Enter your email address"
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary focus:border-primary"
                      />

                      <div className="relative">
                        <ValidatedInput
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          onValidation={handleValidation}
                          validator={validatePassword}
                          label="Password"
                          placeholder="Create a strong password"
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary focus:border-primary pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                        >
                          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                        <PasswordStrengthIndicator password={registerData.password} />
                      </div>

                      <div className="relative">
                        <ValidatedInput
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          onValidation={handleValidation}
                          validator={(value) => validatePasswordConfirmation(registerData.password, value)}
                          label="Confirm Password"
                          placeholder="Confirm your password"
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary focus:border-primary pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                        >
                          {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || registerData.role === 'freelancer' || !isFormValid}
                        className="w-full bg-primary hover:bg-accent text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Creating Account...
                          </div>
                        ) : (
                          'Create Client Account'
                        )}
                      </button>

                      {!isFormValid && Object.keys(validationResults).length > 0 && (
                        <p className="text-error text-sm text-center mt-2">
                          Please fix the validation errors above
                        </p>
                      )}
                    </form>

                    <div className="mt-6 text-center">
                      <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                          onClick={() => setIsLogin(true)}
                          className="text-primary hover:text-accent font-semibold transition-colors"
                        >
                          Sign in here
                        </button>
                      </p>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
