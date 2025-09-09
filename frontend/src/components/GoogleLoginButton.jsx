// frontend/src/components/GoogleLoginButton.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { showToast } from '../utils/toast.jsx';
import { useAuth } from '../contexts/AuthContext';

const GoogleLoginButton = ({ isRegister = false }) => {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google OAuth Success:', credentialResponse);

      // Use AuthContext's googleLogin method to properly update state
      const data = await googleLogin(credentialResponse.credential);

      if (data.success) {
        // Use the dismissible toast utility
        showToast.dismissible(
          isRegister ? 'Registration Successful!' : 'Login Successful!', 
          'success', 
          { id: 'google-login-success' }
        );

        console.log('Google login successful, navigating based on role:', data.user.role);

        // Role-based redirect
        if (data.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.user.role === 'client') {
          navigate('/client');
        } else if (data.user.role === 'freelancer') {
          navigate('/freelancer');
        } else {
          navigate('/');
        }
      } else {
        showToast.dismissible(
          data.message || 'Authentication Failed', 
          'error', 
          { id: 'google-login-error' }
        );
      }
    } catch (error) {
      console.error('Google OAuth Error:', error);
      // Don't show connection error popup - just log it
    }
  };

  const handleGoogleError = () => {
    console.error('Google OAuth Error');
    showToast.dismissible(
      'Google Authentication Failed. Please try again or use email/password login', 
      'error', 
      { id: 'google-login-general-error' }
    );
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text={isRegister ? "signup_with" : "signin_with"}
        shape="rectangular"
        useOneTap={false}
        width="400px"  // Set specific width
      />
      
      {/* Custom styled wrapper to ensure full width */}
      <style>{`
        :global(.google-login-button) {
          width: 100% !important;
          min-height: 48px !important;
        }
        :global(.google-login-button iframe) {
          width: 100% !important;
          height: 48px !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleLoginButton;
