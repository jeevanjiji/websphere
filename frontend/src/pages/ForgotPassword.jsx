import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address.', { dismissible: true });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        toast.success('Reset Link Sent! If an account with that email exists, we have sent a password reset link.', { dismissible: true });
      } else {
        toast.error(data.message || 'Failed to send reset email. Please try again.', { dismissible: true });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Unable to connect to the server. Please try again.', { dismissible: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary via-primary/90 to-secondary overflow-hidden">
      <div className="flex h-full">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative h-full">
          <div className="absolute inset-0 bg-black/20 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=800&fit=crop"
            alt="Password reset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center text-white px-8">
              <motion.h2 
                className="text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Forgot Your Password?
              </motion.h2>
              <motion.p 
                className="text-xl text-white/90"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                No worries! We'll help you reset it quickly and securely.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 h-full overflow-y-auto">
          <div className="w-full max-w-md">
            <Link 
              to="/login"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group mb-6"
            >
              <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Login</span>
            </Link>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EnvelopeIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-white/80">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {!emailSent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending Reset Link...
                      </div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
                  <p className="text-white/80 mb-6">
                    If an account with that email exists, we've sent you a password reset link.
                  </p>
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Send another reset link
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm">
                  Remember your password?{' '}
                  <Link to="/login" className="text-white hover:text-white/80 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
