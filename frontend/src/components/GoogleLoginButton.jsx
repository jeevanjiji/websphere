// frontend/src/components/GoogleLoginButton.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GoogleLoginButton = ({ isRegister = false }) => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google OAuth Success:', credentialResponse);

      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          isRegister: isRegister
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        toast.success(isRegister ? 'Registration Successful!' : 'Login Successful!');

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
        toast.error(data.message || 'Authentication Failed');
      }
    } catch (error) {
      console.error('Google OAuth Error:', error);
      toast.error('Unable to connect to server');
    }
  };

  const handleGoogleError = () => {
    console.error('Google OAuth Error');
    toast.error('Google Authentication Failed. Please try again or use email/password login');
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
