import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      // Check if token is actually an email (from dev verification URLs)
      // Dev URLs have format: /verify-email?token=user@example.com
      const isEmail = token.includes('@') && !token.includes('%40'); // %40 is URL encoded @
      const url = isEmail
        ? `http://localhost:5000/api/auth/dev-verify/${token}`
        : `http://localhost:5000/api/auth/verify-email/${token}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setVerificationStatus('success');
        setMessage(data.message);
        setUserInfo(data.user);

        // Check if there's pending registration data with bio
        const pendingData = JSON.parse(localStorage.getItem('pendingRegistration') || '{}');

        if (pendingData.bio && data.user.role === 'freelancer') {
          // Submit bio after successful verification
          try {
            const formData = new FormData();
            formData.append('bio', pendingData.bio);
            if (pendingData.profilePicture) {
              formData.append('profilePicture', pendingData.profilePicture);
            }

            const bioResponse = await fetch('http://localhost:5000/api/auth/freelancer/auto-tag-bio', {
              method: 'POST',
              credentials: 'include',
              body: formData
            });

            const bioData = await bioResponse.json();

            if (bioData.success) {
              console.log('Bio submitted successfully:', bioData);
            }
          } catch (bioError) {
            console.error('Bio submission error:', bioError);
          }
        }

        // Clear any pending registration data
        localStorage.removeItem('pendingRegistration');

        // Show success notification
        setTimeout(() => {
          toast.success('Email verified! Your account has been successfully verified. Welcome to WebSphere!', { dismissible: true });
        }, 1000);
        
      } else {
        setVerificationStatus('error');
        setMessage(data.message || 'Email verification failed.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      setMessage('Unable to verify email. Please try again or contact support.');
    }
  };

  const handleContinueToDashboard = () => {
    // Store user data if available
    if (userInfo) {
      localStorage.setItem('user', JSON.stringify(userInfo));
    }
    navigate('/freelancer');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center"
      >
        {verificationStatus === 'verifying' && (
          <>
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Verifying Email
              </h1>
              <p className="text-white/80">
                Please wait while we verify your email address...
              </p>
            </div>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-white/80">
                {message}
              </p>
            </div>

            {userInfo && (
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <p className="text-white/90 text-sm mb-2">
                  Welcome to WebSphere, {userInfo.fullName}!
                </p>
                <p className="text-accent font-medium">
                  {userInfo.fullName}
                </p>
                <p className="text-white/70 text-sm">
                  {userInfo.email}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleContinueToDashboard}
                className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRightIcon className="h-5 w-5" />
              </button>

              <button
                onClick={handleGoToLogin}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Go to Login
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-white/60 text-xs">
                Your account is now verified and ready to use!
              </p>
            </div>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <XCircleIcon className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h1>
              <p className="text-white/80">
                {message}
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/freelancer-registration"
                className="block w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg text-center"
              >
                Try Registration Again
              </Link>

              <Link
                to="/login"
                className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-center"
              >
                Back to Login
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-white/60 text-xs">
                Need help? Contact our support team for assistance.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EmailVerified;
