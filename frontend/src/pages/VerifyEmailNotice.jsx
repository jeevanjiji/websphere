import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const VerifyEmailNotice = () => {
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [devVerificationUrl, setDevVerificationUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get email from stored registration data
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    if (pendingRegistration) {
      const data = JSON.parse(pendingRegistration);
      setEmail(data.email);
      setEmailSent(data.emailSent !== false); // Default to true if not specified
      setDevVerificationUrl(data.devVerificationUrl || '');
    } else {
      // If no pending registration, redirect to registration
      navigate('/freelancer-registration');
    }
  }, [navigate]);

  const handleResendVerification = async () => {
    if (!email) return;

    setResending(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setResent(true);
        toast.success('Email Sent! Verification email has been resent to your inbox.', { dismissible: true });
      } else {
        toast.error(data.message || 'Failed to resend verification email.', { dismissible: true });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Unable to resend email. Please try again.', { dismissible: true });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center"
      >
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
            <EnvelopeIcon className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Check Your Email
          </h1>
          <p className="text-white/80">
            We've sent a verification link to your email address
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <p className="text-white/90 text-sm mb-2">
            Verification email sent to:
          </p>
          <p className="text-accent font-medium break-all">
            {email}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 text-left">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">
              Click the verification link in your email
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">
              Complete your freelancer profile setup
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">
              Start browsing and applying to projects
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {emailSent ? (
            <button
              onClick={handleResendVerification}
              disabled={resending || resent}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resending ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Resending...
                </>
              ) : resent ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Email Resent
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5" />
                  Resend Verification Email
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-200 text-sm text-center">
                  📧 Email service is temporarily unavailable
                </p>
              </div>

              {devVerificationUrl && (
                <button
                  onClick={() => window.open(devVerificationUrl, '_blank')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Verify Account (Development)
                </button>
              )}

              <p className="text-white/60 text-xs text-center">
                For testing: Click the development verification button above
              </p>
            </div>
          )}

          <Link
            to="/login"
            className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-center"
          >
            Back to Login
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-white/60 text-xs">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailNotice;
